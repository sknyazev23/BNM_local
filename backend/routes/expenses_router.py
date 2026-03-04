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


@router.get("")
def get_expenses():
    expenses = list(expenses_collection.find())
    for exp in expenses:
        exp["_id"] = str(exp["_id"])
    return expenses

@router.get("/{expense_id}")
def get_expense(expense_id: str):
    expense = expenses_collection.find_one({"_id": ObjectId(expense_id)})
    if not expense:
        raise HTTPException(404, detail="Expense not found")
    expense["_id"] = str(expense["_id"])
    return expense

@router.delete("/{expense_id}")
def delete_expense(expense_id: str):
    result = expenses_collection.delete_one({"_id": ObjectId(expense_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, detail="Expense not found")
    return {"message": "Expense deleted", "expense_id": expense_id}

@router.put("/{expense_id}")
def update_expense(expense_id: str, expense: ExpenseItem):
    sale = sales_collection.find_one({
        "_id": ObjectId(expense.sale_id),
        "job_id": expense.job_id
    })
    if not sale:
        raise HTTPException(400, detail="Sale does not belong to the job")
    
    expenses_dict = expense.model_dump()
    expenses_dict["binded_sale"] = sale.get("description", "").strip()
    
    result = expenses_collection.update_one(
        {"_id": ObjectId(expense_id)},
        {"$set": expenses_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, detail="Expense not found")
        
    return {
        "message": "Expense updated",
        "expense_id": expense_id,
        "job_id": expense.job_id
    }