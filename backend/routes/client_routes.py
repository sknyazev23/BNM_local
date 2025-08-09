from fastapi import APIRouter, HTTPException
from models.client_model import ClientIn
from config import clients_collection
from bson import ObjectId


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
