from fastapi import APIRouter, HTTPException
from models.worker_model import Worker
from config import workers_collection
from bson import ObjectId

router = APIRouter(tags=["Workers"])

@router.options("/")
async def options():
    return {
        "allow": "GET, POST, PATCH, DELETE, OPTIONS",
        "headers": "*"
    }

# Получить всех воркеров
@router.get("")
@router.get("/")
def get_all_workers():
    workers = list(workers_collection.find())
    for w in workers:
        w["_id"] = str(w["_id"])  # Конвертация ObjectId → str
    return workers

# Получить одного воркера по его id
@router.get("/{worker_id}")
def get_worker(worker_id: str):
    try:
        obj_id = ObjectId(worker_id)
    except:
        raise HTTPException(400, "Invalid ID format")
        
    worker = workers_collection.find_one({"_id": obj_id})
    if not worker:
        raise HTTPException(404, "Worker not found")
    worker["id"] = str(worker["_id"])
    del worker["_id"]
    return worker

# Создать нового воркера
@router.post("")
@router.post("/")
def create_worker(worker: Worker):
    data = {
        "name": worker.name,
        "role": worker.role,
        "field": worker.field,
        "mail": worker.mail,
        "percent_rate": worker.percent_rate,
    }
    data = {k: v for k, v in data.items() if v is not None}
 
    result = workers_collection.insert_one(data)
    return {"message": "Worker created", "id": str(result.inserted_id) }


# Обновить воркера по ID
@router.patch("/{worker_id}")
def update_worker(worker_id: str, worker_data: dict):
    try:
        obj_id = ObjectId(worker_id)
    except:
        raise HTTPException(400, "Invalid ID format")
    
    result = workers_collection.update_one({"_id": obj_id}, {"$set": worker_data})
    if result.matched_count == 0:
        raise HTTPException(404, "Worker not found")
    return {"message": "Worker updated"}


# Удалить воркера по ID
@router.delete("/{worker_id}")
def delete_worker(worker_id: str):
    try:
        obj_id = ObjectId(worker_id)
    except:
        raise HTTPException(400, "Invalid ID format")
    
    result = workers_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Worker not found")
    return {"message": "Worker deleted"}
