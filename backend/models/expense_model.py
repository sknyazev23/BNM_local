from pydantic import BaseModel
from typing import Optional


class ExpenseItem(BaseModel):
    job_id: str
    sale_id: str
    description: str
    qty: int = 0
    unit_cost_origin: float = 0.0
    currency_origin: str = "USD"
    amount_origin: float = 0.0
    amount_aed: float = 0.0

    seller: Optional[str] = None
    worker_name: Optional[str] = None
    worker_id: Optional[str] = None
    date_to_seller_payment: Optional[str] = None
    payment_note: Optional[str] = None
    binded_sale: Optional[int] = None
    cost_status: str = "plan"
    edit_date: Optional[str] = None