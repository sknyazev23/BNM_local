from fastapi import APIRouter, HTTPException, Body
from pymongo.errors import DuplicateKeyError
from models.job_model import Job
from config import jobs_collection, sales_collection, expenses_collection, documents_collection, workers_collection
from bson import ObjectId
from collections import Counter
from datetime import datetime
from typing import List, Dict, Any

router = APIRouter()

def _recalc_job_summary(job_id: str):
    job = jobs_collection.find_one({"_id": job_id}, {"main_part": 1}) or {}
    mp = job.get("main_part") or {}

    # курсы
    rate_aed = float(str(mp.get("rate_aed_to_usd") or "3.67"))
    rr = mp.get("rate_rub_to_usd")
    rate_rub = float(str(rr)) if rr not in (None, "",) else None

    def to_usd(val, cur):
        cur = (cur or "USD").upper()
        v = float(val or 0)
        if cur == "USD": return v
        if cur == "AED": return v / (rate_aed or 3.67)
        if cur == "RUB" and rate_rub: return v / rate_rub
        return 0.0

    # дочерние документы
    sales = list(sales_collection.find({"job_id": job_id}, {"_id": 1, "amount": 1, "workers": 1, "worker_id": 1, "coworker_id": 1}))
    exps  = list(expenses_collection.find({"job_id": job_id}, {"_id": 1, "quantity":1,"unit_cost":1,"currency":1,"cost":1,"workers":1,"worker_id":1}))

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
            quantity = float(e.get("quantity") or 0)
            unit_cost = float(e.get("unit_cost") or 0)
            exp_usd += to_usd((quantity * unit_cost), str(e.get("currency") or "USD"))
    profit_usd = round(float(sales_usd - exp_usd), 2)

    # workers: имена (основной + ко-воркеры), порядок по частоте
    ids = []
    for doc_list in [sales, exps]:
        for doc in doc_list:
            # array of workers if provided
            for w in (doc.get("workers") or []):
                ids.append(str(w))
            # single worker_id if provided
            w_id = doc.get("worker_id")
            if w_id and str(w_id).strip():
                ids.append(str(w_id))
            # single coworker_id if provided (usually in sales)
            cw_id = doc.get("coworker_id")
            if cw_id and str(cw_id).strip():
                ids.append(str(cw_id))

    names: List[str] = []
    if ids:
        uniq = [ObjectId(x) for x in set(ids) if ObjectId.is_valid(x)]
        name_by_id: Dict[str, str] = {}
        if uniq:
            for w in workers_collection.find({"_id": {"$in": uniq}}, {"name": 1}):
                name_by_id[str(w["_id"])] = str(w.get("name") or str(w["_id"]))
        freq = Counter(ids)
        order = sorted(freq.keys(), key=lambda x: (-freq[x], name_by_id.get(x, x)))
        names = [str(name_by_id.get(x, x)) for x in order]

    # collect _id references for denormalised arrays
    sales_ids = [str(s["_id"]) for s in sales]
    expenses_ids = [str(e["_id"]) for e in exps]

    jobs_collection.update_one(
        {"_id": job_id},
        {"$set": {
            "profit_usd": profit_usd,
            "workers": names,
            "sales_part": sales_ids,
            "expenses_part": expenses_ids,
        }}
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
            "closed_at": mp.get("closed_at"),
            "serviceDone": job.get("delivery_date"),
            "workers": job.get("workers", []),
            "profit_usd": job.get("profit_usd", 0),
        })
    return rows

@router.post("/")
def create_job(job: Job = Body(...)):
    data = job.model_dump(by_alias=True)
    print("DATA FROM MODEL DUMP:", data)

    # 1) Достаём кастомный job_id
    job_id = data.pop("_id", None)

    if job_id:
        existing_job = jobs_collection.find_one({"_id": job_id})
        if existing_job and "main_part" in existing_job and "created_at" in existing_job["main_part"]:
            data["main_part"]["created_at"] = existing_job["main_part"]["created_at"]
            
    # 2) Обновляем или вставляем документ с пользовательским строковым ID
    if job_id:
        jobs_collection.update_one(
            {"_id": job_id},
            {"$set": data},
            upsert=True
        )

    # 3) Пересчёт profit_usd, workers и т.п.
    _recalc_job_summary(job_id)

    return {"_id": job_id}


@router.get("/generate-id")
def generate_job_id():
    now = datetime.now()
    # Format: BNYYYYMMDD-HHMMSS
    job_id = f"BN{now.strftime('%Y%m%d-%H%M%S')}"

    # Crear макет (skeleton) задачи в БД, чтобы к нему можно было сразу привязывать Sales и Expenses
    skeleton_job = {
        "_id": job_id,
        "status": "open",
        "archived": False,
        "main_part": {
            "bn_number": "",
            "refer_bn": "",
            "client_id": "",
            "client_name": "",
            "rate_aed_to_usd": 3.67,
            "created_at": now
        },
        "sales_part": [],
        "expenses_part": [],
        "profit_usd": 0.0,
        "workers": []
    }
    
    try:
        jobs_collection.insert_one(skeleton_job)
    except DuplicateKeyError:
        pass # Если вдруг сгенерировался дубликат, хотя при точности до секунды маловероятно

    return {"job_id": job_id}


@router.get("/{job_id}")
def get_job(job_id: str):
    job = jobs_collection.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # _recalc_job_summary re-calculates profit and workers but doesn't return the full document
    # We dynamically fetch and embed the latest sales and expenses (they are calculated dynamically on GET)
    sales = list(sales_collection.find({"job_id": job_id}))
    expenses = list(expenses_collection.find({"job_id": job_id}))
    
    # Normalize OjbectId to string
    for s in sales:
        s["_id"] = str(s["_id"])
    for e in expenses:
        e["_id"] = str(e["_id"])
        
    job["sales_part"] = sales
    job["expenses_part"] = expenses
    
    # Convert main _id
    job["_id"] = str(job["_id"])
    return job


@router.put("/{job_id}")
def update_job(job_id: str, payload: dict = Body(...)):
    # Remove _id from payload to avoid MongoDB immutable field error
    payload.pop("_id", None)
        
    # Remove sales_part and expenses_part so we don't accidentally embed them in jobs_collection
    # Because sales and expenses are tracked in their own collections respectively,
    # except that the front-end sends them in putting the job for simplicity.
    # Currently sales and expenses are updated via their own Modals directly to their own collections.
    # So we can safely ignore sales_part and expenses_part here.
    payload.pop("sales_part", None)
    payload.pop("expenses_part", None)

    existing_job = jobs_collection.find_one({"_id": job_id})
    if existing_job and "main_part" in existing_job and "created_at" in existing_job["main_part"]:
        if "main_part" in payload:
            payload["main_part"]["created_at"] = existing_job["main_part"]["created_at"]

    result = jobs_collection.update_one(
        {"_id": job_id},
        {"$set": payload}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    _recalc_job_summary(job_id)
    return {"message": "Job updated successfully", "_id": job_id}


@router.delete("/{job_id}")
def delete_job(job_id: str):
    result = jobs_collection.delete_one({"_id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Also delete cascading documents if necessary
    sales_collection.delete_many({"job_id": job_id})
    expenses_collection.delete_many({"job_id": job_id})
    documents_collection.delete_many({"job_id": job_id})

    return {"message": "Job deleted successfully"}
