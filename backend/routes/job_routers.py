from fastapi import APIRouter, HTTPException
from models.job_model import Job, ExpensesItem, SaleItem
from models.sale_model import SaleIn
from models.expense_model import ExpenseIn
from config import jobs_collection, sales_collection, expenses_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter()

def _oid(v: str|None):
    try:
        return ObjectId(v) if v else None
    except Exception:
        return None

@router.post("/")
def create_job(job: Job):
    # 1) создаём Job
    if jobs_collection.find_one({"job_id": job.job_id}):
        raise HTTPException(status_code=400, detail="Job already exist")

    job_doc = job.model_dump()
    job_doc["sale_ids"] = []
    job_doc["expense_ids"] = []
    inserted = jobs_collection.insert_one(job_doc)
    jid = inserted.inserted_id

    # 2) создаём Sales в отдельной коллекции
    sale_ids = []
    for s in (job.sale_part or []):
        amount_usd = float(s.amount.get("USD", 0))
        sale_doc = {
            "job_id": jid,
            "description": s.description,
            "qty": None,                       # в текущей форме qty нет — оставим None
            "unit_price_usd": None,
            "amount_usd": amount_usd,
            "seller": None,
            "worker_ids": s.workers or [],
            "expense_ids": [],                 # связь «продажа → расходы (много)»
            "status": s.status,
            "created_at": datetime.utcnow(),
        }
        sid = sales_collection.insert_one(sale_doc).inserted_id
        sale_ids.append(sid)

    # 3) создаём Expenses в отдельной коллекции
    expense_ids = []
    for e in (job.expenses_part or []):
        amount_usd = float(e.cost.get("USD", 0))
        exp_doc = {
            "job_id": jid,
            "description": e.description,
            "qty": None,
            "unit_cost_usd": None,
            "amount_usd": amount_usd,
            "seller": None,
            "worker_ids": e.workers or [],
            "sale_id": None,                   # если будет надо — позже свяжем
            "status": e.status,
            "created_at": datetime.utcnow(),
        }
        eid = expenses_collection.insert_one(exp_doc).inserted_id
        expense_ids.append(eid)

    # 4) ссылки в Job
    jobs_collection.update_one(
        {"_id": jid},
        {"$set": {"sale_ids": sale_ids, "expense_ids": expense_ids}}
    )

    return {"message": "Job created", "job_id": job.job_id, "sale_ids": [str(x) for x in sale_ids], "expense_ids": [str(x) for x in expense_ids]}

@router.patch("/{job_id}/expenses")
def add_expense(job_id: str, expense: ExpensesItem):
    job = jobs_collection.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") == "closed":
        raise HTTPException(status_code=400, detail="Cannot modify closed job")

    # 1) в Expenses
    exp_doc = {
        "job_id": job["_id"],
        "description": expense.description,
        "qty": None,
        "unit_cost_usd": None,
        "amount_usd": float(expense.cost.get("USD", 0)),
        "seller": None,
        "worker_ids": expense.workers or [],
        "sale_id": None,
        "status": expense.status,
        "created_at": datetime.utcnow(),
    }
    eid = expenses_collection.insert_one(exp_doc).inserted_id

    # 2) дублируем в Job
    expense.id = f"E{len(job.get('expenses_part', [])) + 1:03d}"
    jobs_collection.update_one(
        {"job_id": job_id},
        {"$push": {
            "expenses_part": expense.model_dump(),
            "expense_ids": eid
        }}
    )
    return {"message": "Expense added", "expense_mongo_id": str(eid), "expense_ui_id": expense.id}

@router.patch("/{job_id}/sales")
def add_sale(job_id: str, sale: SaleItem):
    job = jobs_collection.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job is not found")
    if job.get("status") == "closed":
        raise HTTPException(status_code=400, detail="Cannot modify closed job")

    # 1) в Sales
    sale_doc = {
        "job_id": job["_id"],
        "description": sale.description,
        "qty": None,
        "unit_price_usd": None,
        "amount_usd": float(sale.amount.get("USD", 0)),
        "seller": None,
        "worker_ids": sale.workers or [],
        "expense_ids": [],
        "status": sale.status,
        "created_at": datetime.utcnow(),
    }
    sid = sales_collection.insert_one(sale_doc).inserted_id

    # 2) дублируем в Job
    sale.id = f"S{len(job.get('sale_part', [])) + 1:03d}"
    jobs_collection.update_one(
        {"job_id": job_id},
        {"$push": {
            "sale_part": sale.model_dump(),
            "sale_ids": sid
        }}
    )
    return {"message": "Sale added", "sale_mongo_id": str(sid), "sale_ui_id": sale.id}

@router.patch("/{job_id}/close")
def close_job(job_id: str):
    res = jobs_collection.update_one({"job_id": job_id}, {"$set": {"status": "closed"}})
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job not found or already closed")
    return {"message": f"Job {job_id} closed successfully"}

@router.delete("/{job_id}")
def delete_job(job_id: str):
    job = jobs_collection.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # каскадом чистим sales/expenses по job._id
    jid = job["_id"]
    sales_collection.delete_many({"job_id": jid})
    expenses_collection.delete_many({"job_id": jid})
    jobs_collection.delete_one({"_id": jid})
    return {"message": f"Job {job_id} deleted successfully"}
