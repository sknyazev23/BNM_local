from fastapi import APIRouter, HTTPException, Body
from pymongo.errors import DuplicateKeyError
from models.job_model import Job, ExpensesItem, SaleItem
from config import jobs_collection, sales_collection, expenses_collection, docs_collection
from bson import ObjectId

router = APIRouter()

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
    jobs = list(jobs_collection.find())
    return _normalize(jobs)

@router.post("/")
def create_job(job: Job):
    data = job.model_dump(exclude_none=True)
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

    return {"message": "Job successfully created", "_id": job_id}


@router.get("/{id}")
def get_job(id: str):
    job = jobs_collection.find_one({"_id": ObjectId(id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
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
    res = jobs_collection.delete_one({"_id": ObjectId(id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": f"Job {id} deleted successfully"}


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
    current = jobs_collection.find_one({"_id": ObjectId(id)}, {"archived": 1})
    if not current:
        raise HTTPException(status_code=404, detail="Job not found")
    is_archived = bool(current.get("archived"))

    data = job.model_dump(exclude_none=True)
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
