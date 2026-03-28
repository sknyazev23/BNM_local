from fastapi import APIRouter, HTTPException
from models.expense_model import ExpenseItem
from bson import ObjectId
from config import expenses_collection, sales_collection
from utils.profit_calc import recalc_sale_profit
from utils.job_calc import recalc_job_summary

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

    recalc_sale_profit(expense.sale_id)
    recalc_job_summary(expense.job_id)

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
    old_expense = expenses_collection.find_one({"_id": ObjectId(expense_id)})
    sale_id_to_recalc = old_expense.get("sale_id") if old_expense else None
    job_id_to_recalc = old_expense.get("job_id") if old_expense else None

    result = expenses_collection.delete_one({"_id": ObjectId(expense_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, detail="Expense not found")
        
    if sale_id_to_recalc:
        recalc_sale_profit(sale_id_to_recalc)
    if job_id_to_recalc:
        recalc_job_summary(job_id_to_recalc)

    return {"message": "Expense deleted", "expense_id": expense_id}

@router.put("/{expense_id}")
def update_expense(expense_id: str, expense: ExpenseItem):
    sale = sales_collection.find_one({
        "_id": ObjectId(expense.sale_id),
        "job_id": expense.job_id
    })
    if not sale:
        raise HTTPException(400, detail="Sale does not belong to the job")
    
    old_expense = expenses_collection.find_one({"_id": ObjectId(expense_id)})
    old_sale_id = old_expense.get("sale_id") if old_expense else None
    old_job_id = old_expense.get("job_id") if old_expense else None

    expenses_dict = expense.model_dump()
    expenses_dict["binded_sale"] = sale.get("description", "").strip()
    
    result = expenses_collection.update_one(
        {"_id": ObjectId(expense_id)},
        {"$set": expenses_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, detail="Expense not found")
        
    if old_sale_id and old_sale_id != expense.sale_id:
        recalc_sale_profit(old_sale_id)
    recalc_sale_profit(expense.sale_id)

    if old_job_id and old_job_id != expense.job_id:
        recalc_job_summary(old_job_id)
    recalc_job_summary(expense.job_id)

    return {
        "message": "Expense updated",
        "expense_id": expense_id,
        "job_id": expense.job_id
    }