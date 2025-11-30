from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from typing import Optional, List, Dict, Literal
from datetime import datetime, timezone, date


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
    quantity: int = 0
    unit_cost: float = 0.0
    currency: Literal["USD", "AED", "EUR", "RUB"]
    seller: Optional[str] = None
    cost: Dict[str, float] = Field(default_factory=dict)
    workers: List[str] = Field(default_factory=list)
    status: Literal["plan", "fact"] = "plan"

    sale_id: Optional[str] = Field(default=None, alias="binded_sale")
    payment_note: Optional[str] = None
    payment_date: Optional[date] = None

    amount: Optional[float] = None
    amount_aed: Optional[float] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("status", mode="before")
    @classmethod
    def _status_norm(cls, v):
        if isinstance(v, str):
            v = v.strip().lower()
            return "fact" if v == "fact" else "plan"
        return "plan"

    @field_validator("currency", mode="before")
    @classmethod
    def _currency_upper(cls, v):
        return v.upper() if isinstance(v, str) else v

    @field_validator("workers", mode="before")
    @classmethod
    def _workers_to_str(cls, v):
        if v is None:
            return []
        return [str(x) for x in (v if isinstance(v, list) else [v])]

    @model_validator(mode="after")
    def _fill_amount(self):
        if self.amount is None:
            try:
                self.amount = round(float(self.quantity) * float(self.unit_cost), 4)
            except Exception:
                self.amount = 0.0
        return self

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
    status: str = "open"
    main_part: MainPart

    archived: bool = False
    delivery_date: Optional[date] = Field(default=None, alias="serviceDone")
    
    expenses_part: Optional[List[ExpensesItem]] = []
    sale_part: Optional[List[SaleItem]] = []
    profit_part: Optional[List[ProfitItem]] = []

    profit_usd: Optional[float] = None
    workers: Optional[List[str]] = None
    model_config = ConfigDict(populate_by_name=True)