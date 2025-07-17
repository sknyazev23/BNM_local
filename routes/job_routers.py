from fastapi import APIRouter, HTTPException
from models.job_model import Job, ExpensesItem, SaleItem
from config import job_collection
from bson import ObjectId


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
    job = jobs_collecrtion.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] == "closed":
        raise HTTPException(status_code=400, detail="Cannot modify closed job")
    
    # Генерация ID для расхода
    expense.id = f"E{len(job.get('expenses_part', [])) + 1:03d}"
    job_collection.update_one(
        {"job_id": job_id},
        {"$push": {"expenses_part": expense.model_dump()}}
    )
    return {"message": "Expense added", "expense_id": expense.id}

# добавить доход