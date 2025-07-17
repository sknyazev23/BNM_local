from pydantic import BaseModel
from typing import Optional


class Worker(BaseModel):
    id: str  # W001
    name: str
    role: Optional[str]
    mail: Optional[str]
    percent_rate: Optional[float]