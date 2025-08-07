from fastapi import APIRouter, HTTPException
from models.worker_model import Worker
from config import workers_collection
from bson import ObjectId

router = APIRouter(tags=["Workers"])

# Получить всех воркеров
@router.get("/")
def get_all_workers():
    workers = list(workers_collection.find())
    for w in workers:
        w["_id"] = str(w["_id"])  # Конвертация ObjectId → str
    return workers

# Получить одного воркера по его id
@router.get("/{worker_id}")
def get_worker(worker_id: str):
    worker = workers_collection.find_one({"id": worker_id})
    if not worker:
        raise HTTPException(404, "Worker not found")
    worker["_id"] = str(worker["_id"])
    return worker

# Создать нового воркера
@router.post("/")
def create_worker(worker: Worker):
    last_worker = workers_collection.find_one(
        {"id": {"$regex": "^W\\d{3}$"}},
        sort=[("id", -1)]
    )
    if last_worker:
        try:
            last_number = int(last_worker["id"][1:])
        except ValueError:
            last_number = 0
    else:
        last_number = 0

    new_id = f"W{last_number + 1:03d}"
    worker_dict = worker.model_dump(exclude={"id"})
    worker_dict["id"] = new_id

    result = workers_collection.insert_one(worker_dict)
    return {"message": "Worker added", "worker_id": new_id}


# Обновить воркера по ID
@router.patch("/{worker_id}")
def update_worker(worker_id: str, worker_data: dict):
    result = workers_collection.update_one({"id": worker_id}, {"$set": worker_data})
    if result.matched_count == 0:
        raise HTTPException(404, "Worker not found")
    return {"message": "Worker updated"}

# Удалить воркера по ID
@router.delete("/{worker_id}")
def delete_worker(worker_id: str):
    result = workers_collection.delete_one({"id": worker_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Worker not found")
    return {"message": "Worker deleted"}
