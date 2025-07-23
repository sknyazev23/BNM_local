from pydantic import BaseModel
from typing import Optional
from datetime import datetime



class Document(BaseModel):
    job_id: str
    name: Optional[str]
    upload_date: datetime = datetime.now(datetime.timezone.utc)
    creator: Optional[str]
    worker_id: str
    status: str  # plan/fact
    bn_number: Optional[str] = None
    path: str