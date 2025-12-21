from fastapi import APIRouter, HTTPException
from models.expense_model import ExpenseItem
from bson import ObjectId
from config import expenses_collection, sales_collection


router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("")
def create_expense(expense: ExpenseItem):

    sale = sales_collection.find_one({
        "_id": ObjectId(expense.sale_id),
        "job_id": expense.job_id
    })
    if not sale:
        raise HTTPException(400, detail="Sale does not belong to the job")
    
    expenses_dict = expense.model_dump()

    expenses_dict["binded_sale"] = sale.get("description", "").strip()        
    result = expenses_collection.insert_one(expenses_dict)

    return {
        "message": "Expense created",
        "expense_id": str(result.inserted_id),
        "job_id": expense.job_id
    }