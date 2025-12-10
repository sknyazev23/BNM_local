from fastapi import APIRouter, UploadFile, Form, HTTPException
from config import documents_collection
from pathlib import Path
import aiofiles
from bson import ObjectId
from datetime import timezone, datetime


router = APIRouter()

BASE_DIR = Path.home() / "Documents" / "BN" / "JobFiles"
BASE_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
def upload_document(
    job_id: str = Form(...),
    creator: str = Form(...),
    worker_id: str = Form(...),
    bn_number: str = Form(None),
    status: str = Form(...),
    file: UploadFile = Form(...)
):
    if not file:
        raise HTTPException(400, "File is required")
    
    job_folder = BASE_DIR / job_id
    job_folder.mkdir(parents=True, exist_ok=True)

    file_path = job_folder / file.filename

    with open(file_path, "wb") as out_file:
        content = file.file.read()
        out_file.write(content)

    doc = {
        "job_id": job_id,
        "name": file.filename,
        "upload_date": datetime.now(timezone.utc),
        "creator": creator,
        "worker_id": worker_id,
        "status": status,
        "bn_number": bn_number,
        "path": str(file_path)
    }

    result = documents_collection.insert_one(doc)
    return {"message": "File uploaded", "path": str(file_path), "id": str(result.inserted_id)}


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(400, "Invalid document ID")
        
    doc = documents_collection.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(404, "Document not found")
    
    file_path = Path(doc["path"])
    if file_path.exists():
        file_path.unlink()

    documents_collection.delete_one({"_id": ObjectId(doc_id)})
    return {"message": "Document deleted"}


@router.get("/documents/{job_id}")
def list_documents(job_id: str):
    docs = []
    cursor = documents_collection.find(
        {"job_id": job_id},
        {"_id": 1, "name": 1, "upload_date": 1}
    )
    for doc in cursor:
        doc["_id"] = str(doc["_id"])  # конверт для JSON
        docs.append(doc)
    return docs