from pydantic import BaseModel
from typing import Optional

class ClientIn(BaseModel):

    name: str
    vat_number: Optional[str] = None
    phone: Optional[str] = None
    mail: Optional[str] = None
    contact_person: Optional[str] = None
    country: Optional[str] = None
    note: Optional[str] = None