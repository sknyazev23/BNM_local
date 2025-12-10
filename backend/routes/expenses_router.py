from fastapi import APIRouter, HTTPException
from models.expense_model import ExpenseItem
from config import expenses_collection, jobs_collection


router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("/")
def create_expense(expense: ExpenseItem):
    if not expense.job_id:
        raise HTTPException(400, detail="job_id required")
 
    
    expenses_dict = expense.model_dump()
    expenses_dict["job_id"] = expense.job_id        
    result = expenses_collection.insert_one(expenses_dict)

    return {
        "message": "Expense created",
        "expense_id": str(result.inserted_id),
        "job_id": expense.job_id
    }