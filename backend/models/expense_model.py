from pydantic import BaseModel
from typing import Optional, Dict


class ExpenseIn(BaseModel):
    id: Optional[str] = None
    description: str
    cost: Dict[str, float] = {}
    workers: list[str] = []
    status: str = "plan"
    binded_sale: Optional[int] = None
