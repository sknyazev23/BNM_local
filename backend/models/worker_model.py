from pydantic import BaseModel
from typing import Optional



class Worker(BaseModel):
    name: str
    field: Optional[str]
    role: Optional[str]
    mail: Optional[str]
    percent_rate: Optional[float]