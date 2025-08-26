from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import FileResponse
from config import jobs_collection, workers_collection
from datetime import datetime
from pathlib import Path
import openpyxl
from openpyxl.styles import Font, Alignment


router = APIRouter()

EXPORT_PATH = Path.home() / "Documents" / "BN" / "Exports"
EXPORT_PATH.mkdir(parents=True, exist_ok=True)

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
    if client:
        query["main_part.client_name"] = {"$regex": client, "$options": "i"}
    if worker:
        query["$or"] = [
            {"expenses_part.workers": worker},
            {"sale_part.workers": worker}
        ]
    if status == "open":
        query["status"] = "open"
    elif status == "closed":
        query["status"] = "closed"
    if job_number:
        query["job_id"] = {"$regex": job_number, "$options": "i"}
    if date_from or date_to:
        date_query = {}
        if date_from:
            date_query["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            date_query["$lte"] = datetime.fromisoformat(date_to)
        query["main_part.created_at"] = date_query

    jobs = list(jobs_collection.find(query))

    if not jobs:
        raise HTTPException(404, "No Jobs found for export")
    
    file_path = EXPORT_PATH / f"JobsExport_{datetime.now().strftime('%Y%m%d%H%M')}.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Jobs"

    headers = [
        "№", "Job ID", "Created date", "Client", "Status", "Profit (USD)", "Delivery date", "Workers", "Closed at"
    ]

    ws.append(headers)

    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")

    for idx, job in enumerate(jobs, 1):
        worker_names = set()
        for part in (job.get("expenses_part", []) + job.get("sale_part", [])):
            for wid in part.get("workers", []):
                wdoc = workers_collection.find_one({"worker_id": wid})
                worker_names.add(wdoc.get("name", wid) if wdoc else wid)

        created = job.get("main_part", {}).get("created_at")
        closed  = job.get("main_part", {}).get("closed_at")
        delivery = job.get("delivery_to_client_date")

        profit_usd = calculate_profit(job)

        row = [
            idx,
            job.get("job_id", ""),
            created[:10] if isinstance(created, str) else (created.strftime("%Y-%m-%d") if created else ""),
            job.get("main_part", {}).get("client_name", ""),
            job.get("status", ""),
            round(profit_usd, 2),
            delivery[:10] if isinstance(delivery, str) else (delivery.strftime("%Y-%m-%d") if delivery else ""),
            ", ".join(sorted(worker_names)),
            closed[:10] if isinstance(closed, str) else (closed.strftime("%Y-%m-%d") if closed else ""),
        ]
        ws.append(row)

    wb.save(file_path)
    return FileResponse(file_path, filename=file_path.name)

def calculate_profit(job):
    usd_expenses = sum(float(e.get("cost", {}).get("USD", 0)) for e in job.get("expenses_part", []))
    usd_sales    = sum(float(s.get("amount", {}).get("USD", 0)) for s in job.get("sale_part", []))
    return usd_sales - usd_expenses
