from bson import ObjectId
from config import sales_collection, expenses_collection

def recalc_sale_profit(sale_id: str):
    sale = sales_collection.find_one({"_id": ObjectId(sale_id)})
    if not sale: return
    
    binded_expenses = list(expenses_collection.find({"sale_id": str(sale_id)}))
    total_binded_expense_aed = sum([float(exp.get("amount_aed", 0) or 0) for exp in binded_expenses])
    
    sale_amount_aed = float(sale.get("amount_aed", 0) or 0)
    
    profit_rate = sale.get("profit_rate")
    if profit_rate is None or profit_rate == "":
        profit_rate = 0.0
    else:
        try:
            profit_rate = float(profit_rate)
        except ValueError:
            profit_rate = 0.0
            
    profit_base = sale_amount_aed - total_binded_expense_aed
    calculated_profit = profit_base * (profit_rate / 100.0)
    
    if sale.get("coworker_id"):
        worker_profit = calculated_profit / 2.0
        coworker_profit = calculated_profit / 2.0
    else:
        worker_profit = calculated_profit
        coworker_profit = 0.0
        
    sales_collection.update_one(
        {"_id": ObjectId(sale_id)},
        {"$set": {
            "worker_profit": worker_profit,
            "coworker_profit": coworker_profit
        }}
    )
