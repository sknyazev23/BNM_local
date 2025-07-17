from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import FileResponse
from datetime import datetime
import os, shutil

from config import files_collection
from models.file_model import FileMeta


router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    work_id: str = Form(...),
    file_type: str = Form(...)
):
    # creation work's dir
    file_path = os.path.join(UPLOAD_DIR, work_id)
    os.makedirs(file_path, exist_ok=True)

    full_path = os.path.join(file_path, file.filename)

    # save file
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # save Metadata to MongoDB
    files_collection.insert_one({
        "filename": file.filename,
        "work_id": work_id,
        "type": file_type,
        "upload_date": datetime.now(datetime.timezone.utc),
        "path": full_path
    })

    return{"message": "File uploaded", "path": full_path}

@router.get("/download/{work_id}/{filename}")
async def download_file(work_id: str, filename: str):
    file_path = os.path.join(UPLOAD_DIR, work_id, filename)
    return FileResponse(file_path, media_type="application/octet-stream", filename=filename)