from fastapi import APIRouter, HTTPException
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

    res = jobs_collection.insert_one(data)
    job_oid = res.inserted_id

    if sales:
        for s in sales:
            s["job_id"] = job_oid
        s_ins = sales_collection.insert_many(sales)
        jobs_collection.update_one({"_id": job_oid}, {"$set": {"sale_ids": s_ins.inserted_ids}})

    if expenses:
        for e in expenses:
            e["job_id"] = job_oid
        e_ins = expenses_collection.insert_many(expenses)
        jobs_collection.update_one({"_id": job_oid}, {"$set": {"expense_ids": e_ins.inserted_ids}})
        
    return {"message": "Job successfully created", "_id": str(job_oid)}

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

    expense.id = f"E{len(job.get('expenses_part', [])) + 1:03d}"
    jobs_collection.update_one(
        {"_id": ObjectId(id)},
        {"$push": {"expenses_part": expense.model_dump()}}
    )
    return {"message": "Expense added", "expense_id": expense.id}

@router.patch("/{id}/sales")
def add_sale(id: str, sale: SaleItem):
    job = jobs_collection.find_one({"_id": ObjectId(id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") == "closed":
        raise HTTPException(status_code=400, detail="Cannot modify closed job")

    sale.id = f"S{len(job.get('sale_part', [])) + 1:03d}"
    jobs_collection.update_one(
        {"_id": ObjectId(id)},
        {"$push": {"sale_part": sale.model_dump()}}
    )
    return {"message": "Sale added", "sale_id": sale.id}

@router.patch("/{id}/close")
def close_job(id: str):
    res = jobs_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "closed"}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job not found or already closed")
    return {"message": f"Job {id} closed successfully"}

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

