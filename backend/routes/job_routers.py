from fastapi import APIRouter, HTTPException, Body
from pymongo.errors import DuplicateKeyError
from models.job_model import Job, ExpensesItem, SaleItem
from config import jobs_collection, sales_collection, expenses_collection, docs_collection, workers_collection
from bson import ObjectId
from collections import Counter
from datetime import datetime, timezone

router = APIRouter()

def _recalc_job_summary(job_id: str):
    job = jobs_collection.find_one({"_id": ObjectId(job_id)}, {"main_part": 1}) or {}
    mp = job.get("main_part") or {}

    # курсы
    rate_aed = float(mp.get("rate_aed_to_usd") or 3.67)
    rr = mp.get("rate_rub_to_usd")
    rate_rub = float(rr) if rr not in (None, "",) else None

    def to_usd(val, cur):
        cur = (cur or "USD").upper()
        v = float(val or 0)
        if cur == "USD": return v
        if cur == "AED": return v / (rate_aed or 3.67)
        if cur == "RUB" and rate_rub: return v / rate_rub
        return 0.0

    # дочерние документы
    sales = list(sales_collection.find({"job_id": job_id}, {"amount": 1, "workers": 1}))
    exps  = list(expenses_collection.find({"job_id": job_id}, {"quantity":1,"unit_cost":1,"currency":1,"cost":1,"workers":1}))

    # profit_usd
    sales_usd = 0.0
    for s in sales:
        for cur, val in (s.get("amount") or {}).items():
            sales_usd += to_usd(val, cur)

    exp_usd = 0.0
    for e in exps:
        cost = e.get("cost") or {}
        if cost:
            for cur, val in cost.items():
                exp_usd += to_usd(val, cur)
        else:
            exp_usd += to_usd((e.get("quantity") or 0) * (e.get("unit_cost") or 0), e.get("currency"))
    profit_usd = round(sales_usd - exp_usd, 2)

    # workers: имена (основной + ко-воркеры), порядок по частоте
    ids = []
    for s in sales: ids += [str(w) for w in (s.get("workers") or [])]
    for e in exps:  ids += [str(w) for w in (e.get("workers") or [])]

    names: list[str] = []
    if ids:
        uniq = [ObjectId(x) for x in set(ids) if ObjectId.is_valid(x)]
        name_by_id = {}
        if uniq:
            for w in workers_collection.find({"_id": {"$in": uniq}}, {"name": 1}):
                name_by_id[str(w["_id"])] = w.get("name") or str(w["_id"])
        freq = Counter(ids)
        order = sorted(freq.keys(), key=lambda x: (-freq[x], name_by_id.get(x, x)))
        names = [name_by_id.get(x, x) for x in order]

    jobs_collection.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"profit_usd": profit_usd, "workers": names}}
    )



def _normalize(o):
    if isinstance(o, ObjectId):
        return str(o)
    if isinstance(o, list):
        return [_normalize(x) for x in o]
    if isinstance(o, dict):
        return {k: _normalize(v) for k, v in o.items()}
    return o


@router.get("/")
def get_all_jobs():
    rows = []
    for job in jobs_collection.find():
        jid = str(job.get("_id"))
        mp = job.get("main_part") or {}
        is_arch = bool(job.get("archived", False))

        rows.append({
            "_id": jid,
            "bn_number": mp.get("bn_number"),
            "client_name": mp.get("client_name"),
            "status": "Archived" if is_arch else "Open",
            "created_at": mp.get("created_at"),
            "closed_at": job.get("closed_at"),
            "delivery_date": job.get("delivery_date"),
            "workers": job.get("workers", []),
            "profit_usd": job.get("profit_usd", 0), 
        })
    return rows



@router.post("/")
def create_job(job: Job):
    data = job.model_dump(exclude_none=True)

    sd = data.get("service_done")
    if sd is True and not data.get("delivery_date"):
        data["delivery_date"] = datetime.now(timezone.utc)
    elif sd is False:
        data["delivery_date"] = None

    sales = data.pop("sale_part", [])
    expenses = data.pop("expenses_part", [])

    try:
        res = jobs_collection.insert_one(data)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Duplicate key: bn_number already exists")

    job_id = str(res.inserted_id)

    sale_ids: list[str] = []
    if sales:
        for s in sales:
            s["job_id"] = job_id
        s_ins = sales_collection.insert_many(sales)
        sale_ids = [str(x) for x in s_ins.inserted_ids]

    expense_ids: list[str] = []
    if expenses:
        for e in expenses:
            e["job_id"] = job_id
        e_ins = expenses_collection.insert_many(expenses)
        expense_ids = [str(x) for x in e_ins.inserted_ids]

    jobs_collection.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"sale_ids": sale_ids, "expense_ids": expense_ids}}
    )
    _recalc_job_summary(job_id)

    return {"message": "Job successfully created", "_id": job_id}


@router.get("/{id}")
def get_job(id: str):
    job = jobs_collection.find_one({"_id": ObjectId(id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    expenses = list(expenses_collection.find({"job_id": id}))
    sales = list(sales_collection.find({"job_id": id}))

    job["expenses_part"] = expenses
    job["sale_part"] = sales

    return _normalize(job)


@router.patch("/{id}/expenses")
def add_expense(id: str, expense: ExpensesItem):
    job = jobs_collection.find_one({"_id": ObjectId(id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") == "closed":
        raise HTTPException(status_code=400, detail="Cannot modify closed job")
    if job.get("archived") is True:
        raise HTTPException(status_code=403, detail="Job is archived. Editing is disabled.")

    doc = expense.model_dump(by_alias=True, exclude_none=True)
    doc["job_id"] = id
    ins = expenses_collection.insert_one(doc)

    jobs_collection.update_one(
        {"_id": ObjectId(id)},
        {"$addToSet": {"expense_ids": str(ins.inserted_id)}}
    )
    return {"message": "Expense added", "expense_id": str(ins.inserted_id)}



@router.patch("/{id}/sales")
def add_sale(id: str, sale: SaleItem):
    job = jobs_collection.find_one({"_id": ObjectId(id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") == "closed":
        raise HTTPException(status_code=400, detail="Cannot modify closed job")
    if job.get("archived") is True:
        raise HTTPException(status_code=403, detail="Job is archived! Editing is disabled.")

    doc = sale.model_dump(exclude_none=True)
    doc["job_id"] = id
    ins = sales_collection.insert_one(doc)

    jobs_collection.update_one(
        {"_id": ObjectId(id)},
        {"$addToSet": {"sale_ids": str(ins.inserted_id)}}
    )
    return {"message": "Sale added", "sale_id": str(ins.inserted_id)}



@router.patch("/{id}/close")
def close_job(id: str):
    res = jobs_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "closed"}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    msg = "Job already closed" if res.modified_count == 0 else "Job closed successfully"
    return {"message": msg}


@router.delete("/{id}")
def delete_job(id: str):
    job = jobs_collection.find_one({"_id": ObjectId(id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    #  удаляем связанные документы
    exp_res = expenses_collection.delete_many({"job_id": id})
    sal_res = sales_collection.delete_many({"job_id": id})
    doc_res = docs_collection.delete_many({"job_id": id})

    job_res = jobs_collection.delete_one({"_id": ObjectId(id)})

    return {
        "message": f"Job {id} deleted successfully",
        "deleted": {
            "job": job_res.deleted_count,
            "expenses": exp_res.deleted_count,
            "sales": sal_res.deleted_count,
        },
    }


@router.get("/{job_id}/documents")
def list_job_documents(job_id: str):
 
    pipeline = [
        {"$match": {"job_id": job_id}},
        {"$group": {
            "_id": {"name": {"$ifNull": ["$doc_type", {"$ifNull": ["$type", "Document"]}]}},
            "count": {"$sum": 1}
        }},
        {"$project": {"id": "$_id.name", "name": "$_id.name", "count": 1, "_id": 0}},
        {"$sort": {"name": 1}}
    ]
    return list(docs_collection.aggregate(pipeline))


@router.put("/{id}")
def update_job(id: str, job: Job):
    data = job.model_dump(exclude_none=True)

    current = jobs_collection.find_one({"_id": ObjectId(id)}, {"archived": 1})
    if not current:
        raise HTTPException(status_code=404, detail="Job not found")
    is_archived = bool(current.get("archived"))

    sales = data.pop("sale_part", [])
    expenses = data.pop("expenses_part", [])

    # Если архив — разрешаем менять ТОЛЬКО флаги,
    if is_archived:
        allowed = {}
        if "service_not_delivered" in data:
            allowed["service_not_delivered"] = bool(data["service_not_delivered"])
        if "archived" in data:
            allowed["archived"] = bool(data["archived"])

        forbidden_payload = (sales or expenses or
                             any(k not in ("service_not_delivered", "archived") for k in data.keys()))
        if forbidden_payload and not allowed:
            raise HTTPException(status_code=403, detail="Job is archived. Editing is disabled")
        if allowed:
            jobs_collection.update_one({"_id": ObjectId(id)}, {"$set": allowed})

        sale_count = sales_collection.count_documents({"job_id": id})
        expense_count = expenses_collection.count_documents({"job_id": id})
        return {
            "message": "Job flags updated" if allowed else "Job is archived. No changes applied!",
            "_id": id,
            "sale_count": sale_count,
            "expense_count": expense_count,
        }

    # 3) Если НЕ архив — работаем
    try:
        res = jobs_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Duplicate key: bn_number already exists")

    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    sales_collection.delete_many({"job_id": id})
    expenses_collection.delete_many({"job_id": id})

    sale_ids: list[str] = []
    if sales:
        for s in sales:
            s["job_id"] = id
        s_ins = sales_collection.insert_many(sales)
        sale_ids = [str(x) for x in s_ins.inserted_ids]

    expense_ids: list[str] = []
    if expenses:
        for e in expenses:
            e["job_id"] = id
        e_ins = expenses_collection.insert_many(expenses)
        expense_ids = [str(x) for x in e_ins.inserted_ids]

    jobs_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"sale_ids": sale_ids, "expense_ids": expense_ids}}
    )

    return {
        "message": "Job updated",
        "_id": id,
        "sale_count": len(sale_ids),
        "expense_count": len(expense_ids),
    }
