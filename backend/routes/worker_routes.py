from fastapi import APIRouter, HTTPException
from models.worker_model import Worker
from config import workers_collection


router = APIRouter()

@router.get("/")
def get_all_workers():
    workers = list(workers_collection.find())
    for w in workers:
        w["_id"] = str(w["_id"])
    return workers

@router.post("/")
def create_worker(worker: Worker):
    if workers_collection.find_one({"id": worker.id}):
        raise HTTPException(400, "Worker already exist")
    workers_collection.insert_one(worker.model_dump())
    return {"mwssage": "Worker added", "worker_id": worker.id}