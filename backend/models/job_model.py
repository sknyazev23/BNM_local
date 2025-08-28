from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timezone


# основной блок данных
class MainPart(BaseModel):
    bn_number: Optional[str] = None
    refer_bn: Optional[str] = None
    client_id: str
    client_name: str
    carrier: Optional[str]
    shipper: Optional[str]
    consignee: Optional[str]
    commodities: Optional[str]
    quantity: Optional[int]
    weight: Optional[float] = None
    port_loading: Optional[str] = None
    port_discharge: Optional[str] = None
    payment_terms: Optional[str] = None
    payment_location: Optional[str] = None
    payer_company: Optional[str] = None

    rate_aed_to_usd: Optional[float]
    rate_aed_to_eur: Optional[float]
    rate_rub_to_usd: Optional[float]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
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
    status: str = "open"  # open/close
    main_part: MainPart
    expenses_part: Optional[List[ExpensesItem]] = []
    sale_part: Optional[List[SaleItem]] = []
    profit_part: Optional[List[ProfitItem]] = []