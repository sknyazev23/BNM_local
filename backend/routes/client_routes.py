from fastapi import APIRouter, HTTPException
from models.client_model import ClientIn
from config import clients_collection
from bson import ObjectId
from typing import Optional
from pydantic import BaseModel


router = APIRouter(tags=["Clients"])

@router.get("/")
def get_clients():
    items = list(clients_collection.find())
    for it in items:
        it["_id"] = str(it["_id"])
    return items

@router.post("/", status_code=201)
def create_client(payload: ClientIn):
    doc = payload.model_dump()
    res = clients_collection.insert_one(doc)
    if not res.inserted_id:
        raise HTTPException(500, "Failed to insert client")

    saved = clients_collection.find_one({"_id": res.inserted_id})
    saved["_id"] = str(saved["_id"])
    return saved


# --- ДОБАВИТЬ НИЖЕ СУЩЕСТВУЮЩИХ ЭНДПОИНТОВ ---


# Модель для частичного обновления (PATCH)
class ClientUpdate(BaseModel):
    name: Optional[str] = None
    vat_number: Optional[str] = None
    phone: Optional[str] = None
    mail: Optional[str] = None
    contact_person: Optional[str] = None
    country: Optional[str] = None
    note: Optional[str] = None

def _ensure_oid(client_id: str) -> ObjectId:
    if not ObjectId.is_valid(client_id):
        raise HTTPException(status_code=400, detail="Invalid client ID")
    return ObjectId(client_id)

def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc["_id"] = str(doc["_id"])
    return doc

# ── GET one (на будущее/удобство фронта)
@router.get("/{client_id}")
@router.get("/{client_id}/")   # принимаем и со слэшем, и без
def get_client(client_id: str):
    oid = _ensure_oid(client_id)
    doc = clients_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Client not found")
    return _serialize(doc)

# ── PUT: полная замена (используем твою модель ClientIn)
@router.put("/{client_id}")
@router.put("/{client_id}/")
def update_client_put(client_id: str, payload: ClientIn):
    oid = _ensure_oid(client_id)
    update = {"$set": payload.model_dump()}
    res = clients_collection.update_one({"_id": oid}, update)
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    doc = clients_collection.find_one({"_id": oid})
    return _serialize(doc)

# ── PATCH: частичное обновление
@router.patch("/{client_id}")
@router.patch("/{client_id}/")
def update_client_patch(client_id: str, payload: ClientUpdate):
    oid = _ensure_oid(client_id)
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = clients_collection.update_one({"_id": oid}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    doc = clients_collection.find_one({"_id": oid})
    return _serialize(doc)

# ── DELETE
@router.delete("/{client_id}")
@router.delete("/{client_id}/")
def delete_client(client_id: str):
    oid = _ensure_oid(client_id)
    res = clients_collection.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted"}
