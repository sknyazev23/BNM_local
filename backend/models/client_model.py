from pydantic import BaseModel
from typing import Optional


class Client(BaseModel):
    id: str  # C001
    name: str
    vat_number: Optional[str]
    phone: Optional[str]
    mail: Optional[str]
    contact_person: Optional[str]