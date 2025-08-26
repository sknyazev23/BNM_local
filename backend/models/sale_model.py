from pydantic import BaseModel
from typing import Optional, Dict


class SaleIn(BaseModel):
    id: Optional[str] = None
    description: str
    amount: Dict[str, float] = {}   # {"USD": .., "AED": ..}
    workers: list[str] = []
    status: str = "plan"

    binded_expense: Optional[int] = None