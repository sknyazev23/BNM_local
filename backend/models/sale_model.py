from pydantic import BaseModel
from typing import Optional, Dict, List

class SaleIn(BaseModel):
    id: Optional[str] = None
    job_id: Optional[str] = None
    description: str
    qty: Optional[int] = None
    unit_price_aed: Optional[float] = None
    amount_aed: Optional[float] = 0.0  # дефолт 0
    amount: Dict[str, float] = {}
    seller: Optional[str] = None
    worker_ids: List[str] = []
    expense_ids: List[str] = []
    status: str = "plan"
    date_client_payment: Optional[str] = None  # Date as str (ISO)
    client_payment_note: Optional[str] = None
    rate_of_payment: Optional[float] = None
    # created_at — генерируем в бэке, не в модели