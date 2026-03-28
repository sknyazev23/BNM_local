from fastapi import APIRouter, HTTPException
from models.sale_model import SaleItem
from config import sales_collection
from bson import ObjectId
from utils.profit_calc import recalc_sale_profit
from utils.job_calc import recalc_job_summary

router = APIRouter(prefix="/sales", tags=["sales"])

@router.post("/")
def create_sale(sale: SaleItem):
    if not sale.job_id:
        raise HTTPException(400, detail="job_id required")
 
    
    sale_dict = sale.model_dump()
    sale_dict["job_id"] = sale.job_id        
    result = sales_collection.insert_one(sale_dict)

    inserted_str_id = str(result.inserted_id)
    recalc_sale_profit(inserted_str_id)
    recalc_job_summary(sale.job_id)

    return {
        "message": "Sale created",
        "sale_id": inserted_str_id,
        "job_id": sale.job_id
    }


@router.get("/")
def get_sales():
    sales = list(sales_collection.find())
    for s in sales:
        s["_id"] = str(s["_id"])
    return sales

@router.get("/by-job")
def get_sale_by_job(job_id: str):
    sales = list(
        sales_collection.find(
            {"job_id": job_id},
            {"_id": 1, "description": 1}
        )
    )
    for s in sales:
        s["_id"] = str(s["_id"])
    return sales

@router.get("/{sale_id}")
def get_sale(sale_id: str):
    sale = sales_collection.find_one({"_id": ObjectId(sale_id)})
    if not sale:
        raise HTTPException(404, detail="Sale not found")
    sale["_id"] = str(sale["_id"])
    return sale

@router.delete("/{sale_id}")
def delete_sale(sale_id: str):
    sale = sales_collection.find_one({"_id": ObjectId(sale_id)})
    job_id_to_recalc = sale.get("job_id") if sale else None

    result = sales_collection.delete_one({"_id": ObjectId(sale_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, detail="Sale not found")
        
    if job_id_to_recalc:
        recalc_job_summary(job_id_to_recalc)

    return {"message": "Sale deleted", "sale_id": sale_id}



@router.put("/{sale_id}")
def update_sale(sale_id: str, sale: SaleItem):
    if not sale.job_id:
        raise HTTPException(400, detail="job_id required")
        
    old_sale = sales_collection.find_one({"_id": ObjectId(sale_id)})
    old_job_id = old_sale.get("job_id") if old_sale else None

    sale_dict = sale.model_dump()
    sale_dict["job_id"] = sale.job_id
    
    result = sales_collection.update_one(
        {"_id": ObjectId(sale_id)},
        {"$set": sale_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, detail="Sale not found")
        
    recalc_sale_profit(sale_id)

    if old_job_id and old_job_id != sale.job_id:
        recalc_job_summary(old_job_id)
    recalc_job_summary(sale.job_id)

    return {
        "message": "Sale updated",
        "sale_id": sale_id,
        "job_id": sale.job_id
    }