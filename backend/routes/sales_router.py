from fastapi import APIRouter, HTTPException
from models.sale_model import SaleItem
from config import sales_collection, jobs_collection


router = APIRouter(prefix="/sales", tags=["sales"])

@router.post("/")
def create_sale(sale: SaleItem):
    if not sale.job_id:
        raise HTTPException(400, detail="job_id required")
 
    
    sale_dict = sale.model_dump()
    sale_dict["job_id"] = sale.job_id        
    result = sales_collection.insert_one(sale_dict)

    return {
        "message": "Sale created",
        "sale_id": str(result.inserted_id),
        "job_id": sale.job_id
    }