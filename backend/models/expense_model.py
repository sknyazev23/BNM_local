from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class ExpenseItem(BaseModel):
    job_id: str = Field(..., min_length=1)
    sale_id: str = Field(..., min_length=1)

    cost_description: str = Field(..., min_length=1)

    quantity: int = 0
    unit_cost_origin: float = 0.0
    currency_origin: str = "USD"
    amount_origin: float = 0.0
    amount_aed: float = 0.0

    seller: Optional[str] = None
    worker_name: Optional[str] = None
    worker_id: Optional[str] = None
    date_to_seller_payment: Optional[datetime] = None
    payment_note: Optional[str] = None
    binded_sale: Optional[str] = None
    
    cost_status: Literal["plan", "fact"] = "plan"
    edit_date: datetime