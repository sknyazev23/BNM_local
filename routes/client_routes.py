from fastapi import APIRouter, HTTPException
from models.client_model import Client
from config import clients_collection


router = APIRouter()

@router.get("/")
def get_all_clients():
    clients = list(clients_collection.find())
    for c in clients:
        c["_id"] = str(c["_id"])
    return clients


@router.post("/")
def create_client(client: Client):
    if clients_collection.find_one({"id": client.id}):
        raise HTTPException(400, "Client already exist")
    clients_collection.insert_one(client.model_dump())
    return {"message": "Client added", "client_id": client.id}