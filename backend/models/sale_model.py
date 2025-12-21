from pydantic import BaseModel
from typing import Optional


class SaleItem(BaseModel):
    job_id: str
    description: str
    quantity: int = 0
    unit_price_origin: float = 0.0
    currency_origin: str = "USD"
    amount_origin: float = 0.0
    amount_aed: float = 0.0

    worker_name: Optional[str] = None
    worker_id: Optional[str] = None
    date_client_payment: Optional[str] = None
    rate_of_payment: Optional[float] = None
    coworker_name: Optional[str] = None
    client_payment_note: Optional[str] = None
    
    sale_status: str = "plan"
    edit_date: Optional[str] = None