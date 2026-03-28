from fastapi import APIRouter, HTTPException, Body, UploadFile, Form, File
from typing import Optional
from pymongo.errors import DuplicateKeyError
from models.job_model import Job
from config import jobs_collection, sales_collection, expenses_collection, documents_collection, workers_collection
from bson import ObjectId
from collections import Counter
from datetime import datetime
from typing import List, Dict, Any
from utils.job_calc import recalc_job_summary

router = APIRouter()

def _normalize(o):
    if isinstance(o, ObjectId):
        return str(o)
    if isinstance(o, list):
        return [_normalize(x) for x in o]
    if isinstance(o, dict):
        return {k: _normalize(v) for k, v in o.items()}
    return o


@router.get("/")
def get_all_jobs():
    rows = []

    for job in jobs_collection.find():
        jid = str(job.get("_id"))
        mp = job.get("main_part") or {}
        is_arch = bool(job.get("archived", False))

        rows.append({
            "_id": jid,
            "bn_number": mp.get("bn_number"),
            "client_name": mp.get("client_name"),
            "status": "Archived" if is_arch else "Open",
            "created_at": mp.get("created_at"),
            "closed_at": mp.get("closed_at"),
            "serviceDone": job.get("delivery_date"),
            "workers": job.get("workers", []),
            "profit_usd": job.get("profit_usd", 0),
        })
    return rows

@router.post("/")
def create_job(job: Job = Body(...)):
    data = job.model_dump(by_alias=True)
    print("DATA FROM MODEL DUMP:", data)

    # 1) Достаём кастомный job_id
    job_id = data.pop("_id", None)

    if job_id:
        existing_job = jobs_collection.find_one({"_id": job_id})
        if existing_job and "main_part" in existing_job and "created_at" in existing_job["main_part"]:
            data["main_part"]["created_at"] = existing_job["main_part"]["created_at"]
            
    # 2) Обновляем или вставляем документ с пользовательским строковым ID
    if job_id:
        jobs_collection.update_one(
            {"_id": job_id},
            {"$set": data},
            upsert=True
        )

    # 3) Пересчёт profit_usd, workers и т.п.
    recalc_job_summary(job_id)

    return {"_id": job_id}


@router.get("/generate-id")
def generate_job_id():
    now = datetime.now()
    # Format: BNYYYYMMDD-HHMMSS
    job_id = f"BN{now.strftime('%Y%m%d-%H%M%S')}"

    # Crear макет (skeleton) задачи в БД, чтобы к нему можно было сразу привязывать Sales и Expenses
    skeleton_job = {
        "_id": job_id,
        "status": "open",
        "archived": False,
        "main_part": {
            "bn_number": "",
            "refer_bn": "",
            "client_id": "",
            "client_name": "",
            "rate_aed_to_usd": 3.67,
            "created_at": now
        },
        "sales_part": [],
        "expenses_part": [],
        "profit_usd": 0.0,
        "workers": []
    }
    
    try:
        jobs_collection.insert_one(skeleton_job)
    except DuplicateKeyError:
        pass # Если вдруг сгенерировался дубликат, хотя при точности до секунды маловероятно

    return {"job_id": job_id}


@router.get("/{job_id}")
def get_job(job_id: str):
    job = jobs_collection.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # _recalc_job_summary re-calculates profit and workers but doesn't return the full document
    # We dynamically fetch and embed the latest sales and expenses (they are calculated dynamically on GET)
    sales = list(sales_collection.find({"job_id": job_id}))
    expenses = list(expenses_collection.find({"job_id": job_id}))
    
    # Normalize OjbectId to string
    for s in sales:
        s["_id"] = str(s["_id"])
    for e in expenses:
        e["_id"] = str(e["_id"])
        
    job["sales_part"] = sales
    job["expenses_part"] = expenses
    
    # Convert main _id
    job["_id"] = str(job["_id"])
    return job


@router.put("/{job_id}")
def update_job(job_id: str, payload: dict = Body(...)):
    # Remove _id from payload to avoid MongoDB immutable field error
    payload.pop("_id", None)
        
    # Remove sales_part and expenses_part so we don't accidentally embed them in jobs_collection
    # Because sales and expenses are tracked in their own collections respectively,
    # except that the front-end sends them in putting the job for simplicity.
    # Currently sales and expenses are updated via their own Modals directly to their own collections.
    # So we can safely ignore sales_part and expenses_part here.
    payload.pop("sales_part", None)
    payload.pop("expenses_part", None)

    existing_job = jobs_collection.find_one({"_id": job_id})
    if existing_job and "main_part" in existing_job and "created_at" in existing_job["main_part"]:
        if "main_part" in payload:
            payload["main_part"]["created_at"] = existing_job["main_part"]["created_at"]

    result = jobs_collection.update_one(
        {"_id": job_id},
        {"$set": payload}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    recalc_job_summary(job_id)
    return {"message": "Job updated successfully", "_id": job_id}


@router.delete("/{job_id}")
def delete_job(job_id: str):
    result = jobs_collection.delete_one({"_id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Also delete cascading documents if necessary
    sales_collection.delete_many({"job_id": job_id})
    expenses_collection.delete_many({"job_id": job_id})
    documents_collection.delete_many({"job_id": job_id})

    return {"message": "Job deleted successfully"}


@router.post("/bulk-delete")
def bulk_delete_jobs(job_ids: list[str]):
    if not job_ids:
        return {"message": "No jobs provided"}
    
    # Cascade delete for all selected jobs
    jobs_collection.delete_many({"_id": {"$in": job_ids}})
    sales_collection.delete_many({"job_id": {"$in": job_ids}})
    expenses_collection.delete_many({"job_id": {"$in": job_ids}})
    documents_collection.delete_many({"job_id": {"$in": job_ids}})
    
    return {"message": f"Successfully deleted {len(job_ids)} jobs and their associated data"}


# ====================== DOCUMENTS ======================

BASE_DOCS_DIR = None

def _get_base_dir():
    from pathlib import Path
    d = Path.home() / "Documents" / "BN" / "JobFiles"
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.get("/{job_id}/documents")
def get_job_documents(job_id: str):
    """Вернуть список документов для джоба, сгруппированных по имени."""
    cursor = documents_collection.find(
        {"job_id": job_id},
        {"_id": 1, "name": 1, "upload_date": 1, "path": 1}
    )
    docs = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        docs.append(doc)

    # группируем по name, чтобы вернуть {name, count, id, path}
    docs_by_name = {}
    for d in docs:
        if d["name"] not in docs_by_name:
            docs_by_name[d["name"]] = {"count": 0, "path": d.get("path"), "id": d["_id"]}
        docs_by_name[d["name"]]["count"] += 1
        
    result = []
    for n, data in docs_by_name.items():
        result.append({
            "name": n,
            "count": data["count"],
            "id": data["id"],
            "path": data["path"]
        })
    return result


@router.post("/{job_id}/documents")
def upload_job_document(
    job_id: str,
    name: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """Загрузить один или несколько файлов, привязанных к джобу."""
    if not files:
        raise HTTPException(400, "At least one file is required")

    base_dir = _get_base_dir()
    job_folder = base_dir / job_id
    job_folder.mkdir(parents=True, exist_ok=True)

    from datetime import timezone
    inserted = []
    for f in files:
        content = f.file.read()
        file_path = job_folder / f.filename
        with open(file_path, "wb") as out:
            out.write(content)

        doc = {
            "job_id": job_id,
            "name": name.strip() or f.filename,
            "original_filename": f.filename,
            "upload_date": datetime.now(timezone.utc),
            "path": str(file_path),
        }
        result = documents_collection.insert_one(doc)
        inserted.append(str(result.inserted_id))

    return {"message": "Uploaded", "count": len(inserted), "ids": inserted}

