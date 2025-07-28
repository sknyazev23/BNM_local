from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import FileResponse
from config import jobs_collection, workers_collection
from datetime import datetime
from pathlib import Path
import openpyxl
from openpyxl.sttyles import Font, Aligement


router = APIRouter()

EXPORT_PATH = Path.home() /"Documents" / "BN" / "Exports"
EXPORT_PATH.mrdir(parents=True, exist_ok=True)

@router.get("/jobs/export")
def export_jobs(
    client: str = Query(None),
    worker: str = Query(None),
    status: str = Query(None),
    job_number: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None)
):
    query = {}
    