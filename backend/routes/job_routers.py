from fastapi import APIRouter, HTTPException
from models.job_model import Job, ExpensesItem, SaleItem
from config import jobs_collection
from bson import ObjectId
import os


router = APIRouter()

# получить все работы
@router.get("/")
def get_all_jobs():
    jobs = list(jobs_collection.find())
    for job in jobs:
        job["_id"] = str(job["_id"])
    return jobs

# создать новую работу
@router.post("/")
def create_job(job: Job):
    if jobs_collection.find_one({"job_id": job.job_id}):
        raise HTTPException(status_code=400, detail="Job already exist")
    
    jobs_collection.insert_one(job.model_dump())
    return {"message": "Job created", "job_id": job.job_id}

# получить работу по ID
@router.get("/{job_id}")
def get_job(job_id: str):
    job = jobs_collection.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job["_id"] = str(job["_id"])   # convert to ObjectId
    return job

# добавить расход
@router.patch("/{job_id}/expenses")
def add_expense(job_id: str, expense: ExpensesItem):
    job = jobs_collection.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] == "closed":
        raise HTTPException(status_code=400, detail="Cannot modify closed job")
    
    # Генерация ID для расхода
    expense.id = f"E{len(job.get('expenses_part', [])) + 1:03d}"
    jobs_collection.update_one(
        {"job_id": job_id},
        {"$push": {"expenses_part": expense.model_dump()}}
    )
    return {"message": "Expense added", "expense_id": expense.id}

# добавить доход
@router.patch("/{job_id}/sales")
def add_sale(job_id: str, sale: SaleItem):
    job = jobs_collection.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job is not found")
    if job["status"] == "closed":
        raise HTTPException(status_code=400, detail="Cannot modify closed job")
    
    sale.id = f"S{len(job.get('sale_part', [])) + 1:03d}"
    jobs_collection.update_one(
        {"job_id": job_id},
        {"$push": {"sale_part": sale.model_dump()}}
    )
    return {"message": "Sale added", "sale_id": sale.id}

# закрыть работу
@router.patch("/{job_id}/close")
async def close_job(job_id: str):
    result = jobs_collection.find_one(
        {"job_id": job_id},
        {"$set": {"status": "closed"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job not found or already closed")
    
    # jobs_collection.update_one({"job_id": job_id}, {"$set": {"status": "closed"}})
    return {"message": f"Job {job_id} closed successfully"}

# Удалить работу
@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    res = jobs_collection.delete_one({"job_id": job_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found or already closed")
    return {"message": f"Job {job_id} closed successfully"}


# пересчет профита
@router.post("/{job_id}/recalculate-profit")
def recalculate_profit(job_id: str):
    job = jobs_collection.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # группируем по description
    expenses = job.get("expenses_part", [])
    sales = job.get("sale_part", [])

    expense_map = {}
    sale_map = {}

    for e in expenses:
        expense_map[e["description"]] = expense_map.get(e["description"], 0) + e["cost"].get("USD", 0)
    for s in sales:
        sale_map[e["description"]] = sale_map.get(s["description"], 0) + s["amount"].get("USD", 0)

    # расчет профита
    worker_profit = {}

    for desc, sale_amount in sale_map.items():
        expense_amount = expense_map.get(desc, 0)
        service_profit = sale_amount - expense_amount

        sale_workers = []
        for s in sales:
            if s["description"] == desc:
                sale_workers.extend(s["workers"])

        expense_workers = []
        for e in expenses:
            if e["description"] == desc:
                expense_workers.extend(e["workers"])

        all_workers = list(set(sale_workers + expense_workers))
        if not all_workers:
            continue

        share = service_profit / len(all_workers)
        for w in all_workers:
            worker_profit[w] = worker_profit.get(w, 0) + share

    profit_part = [{"worker_id": w, "profit_share": round(p, 2)} for w, p in worker_profit.items()]
    jobs_collection.update_one({"job_id": job_id}, {"$set": {"profit_part": profit_part}})
    return {"profit_part": profit_part}