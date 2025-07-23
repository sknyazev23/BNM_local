from fastapi import APIRouter, UploadFile, Form, HTTPException
from config import docs_collection
from pathlib import Path
import aiofiles
import shutil
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

    docs_collection.insert_one(doc)
    return {"message": "File uploaded", "path": str(file_path)}


