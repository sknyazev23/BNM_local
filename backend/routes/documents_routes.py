from fastapi import APIRouter, UploadFile, Form, HTTPException
from config import documents_collection
from pathlib import Path
import aiofiles
from bson import ObjectId
from datetime import datetime


router = APIRouter()

BASE_DIR = Path.home() / "Documents" / "BN" / "JobFiles"
BASE_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(
    job_id: str = Form(...),
    creator: str = Form(...),
    worker_id: str = Form(...),
    bn_number: str = Form(None),
    status: str = Form(...),
    file: UploadFile = None
):
    if not file:
        raise HTTPException(400, "File is required")
    
    job_folder = BASE_DIR / job_id
    job_folder.mkdir(parents=True, exist_ok=True)

    file_path = job_folder / file.filename

    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    doc = {
        "job_id": job_id,
        "name": file.filename,
        "upload_date": datetime.now(datetime.timezone.utc),
        "creator": creator,
        "worker_id": worker_id,
        "status": status,
        "bn_number": bn_number,
        "path": str(file_path)
    }

    documents_collection.insert_one(doc)
    return {"message": "File uploaded", "path": str(file_path)}


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    doc = documents_collection.find_one({"_id": ObjectId(doc_id)})
    if  not doc:
        raise HTTPException(404, "Document is not found")
    
    file_path = Path(doc["path"])
    if file_path.exists():
        file_path.unlink()

    documents_collection.delete_one({"_id": ObjectId(doc_id)})
    return {"message": "Document deleted"}


@router.get("/documents/{job_id}")
async def list_documents(job_id: str):
    docs = list(documents_collection.find(
        {"job_id": job_id},
        {"_id": 1, "name": 1, "upload_date": 1})
        )
    for doc in docs:
        doc["_id"] = str(doc["_id"]) # конверт для JSON
    return docs
