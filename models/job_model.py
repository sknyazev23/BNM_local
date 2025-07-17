from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


# основной блок данных
class MainPart(BaseModel):
    client_id: str
    client_name: str
    carrier: Optional[str]
    shipper: Optional[str]
    consignee: Optional[str]
    commodities: Optional[str]
    quantity: Optional[int]
    rate_aed_to_usd: Optional[float]
    rate_aed_to_eur: Optional[float]
    rate_rub_to_usd: Optional[float]
    created_at: datetime = Field(default_factory=datetime.now(datetime.timezone.utc))
    closed_at: Optional[datetime] = None

# расходы
class ExpensesItem(BaseModel):
    id: Optional[str] = None
    description: str
    cost: Dict[str, float]  # {"USD": 100, "AED": 367}
    workers: List[str]  # список worker_id
    status: str  # plan/fact

# доходы
class SaleItem(BaseModel):
    id: Optional[str] = None
    description: str
    amount: Dict[str, float]
    workers: List[str]
    status: str  # plan/fact

# профит
class ProfitItem(BaseModel):
    worker_id: str
    profit_share: float

# основная модель Job
class Job(BaseModel):
    job_id: str
    status: str = "open"  # open/close
    main_part: MainPart
    expenses_part: Optional[List[ExpensesItem]] = []
    sale_part: Optional[List[SaleItem]] = []
    profit_part: Optional[List[ProfitItem]] = []