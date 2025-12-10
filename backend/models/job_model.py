from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from typing import Optional, List
from datetime import datetime, timezone, date
from .sale_model import SaleItem
from .expense_model import ExpenseItem


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

    rate_aed_to_usd: float
    rate_aed_to_eur: Optional[float] = None
    rate_rub_to_usd: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None

# профит
class ProfitItem(BaseModel):
    worker_id: str
    profit_share: float

# основная модель Job
class Job(BaseModel):
    id: str = Field(..., alias="_id")
    status: str = "open"
    main_part: MainPart
    archived: bool = False
    delivery_date: Optional[date] = Field(default=None, alias="serviceDone")
    
    sales_part: List[SaleItem] = Field(default_factory=list)
    expenses_part: List[ExpenseItem] = Field(default_factory=list)

    profit_part: List[ProfitItem] = Field(default_factory=list)
    profit_usd: Optional[float] = None
    workers: List[str] = Field(default_factory=list)
    model_config = ConfigDict(populate_by_name=True)