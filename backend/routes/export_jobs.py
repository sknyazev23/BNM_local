from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import FileResponse
from config import jobs_collection, workers_collection
from datetime import datetime
from pathlib import Path
import openpyxl
from openpyxl.styles import Font, Alignment


router = APIRouter()

EXPORT_PATH = Path.home() /"Documents" / "BN" / "Exports"
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
        query["main_part.client"] = {"$regex": client, "$options": "i"}
    if worker:
        query["$or"] = [
            {"expenses_part.worker": worker},
            {"sale_part.worker": worker}
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
        query["created_at"] = date_query

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

    for col in ws.iter_cols(min_row=1, max_row=1):
        for cell in col:
            cell.font = Font(bold=True)
            cell.alignment = Aligement(horizontal="center")

    for idx, job in enumerate(jobs, 1):
        worker_names = set()

        for part in job.get("expenses_part", []) + job.get("sale_part", []):
            if part.get("worker"):
                worker_doc = workers_collection.find_one({"worker_id": part["worker"]})
                if worker_doc:
                    worker_names.add(worker_doc.get("name", part["worker"]))
                else:
                    worker_names.add(part["worker"])

        profit_usd = calculate_profit(job)
        row = [
            idx,
            job.get("job_id", ""),
            job.get("main_part", {}).get("client", ""),
            job.get("status", ""),
            job.get("created_at", "").strftime("%Y-%m-%d") if job.get("created_at") else "",
            job.get("closed_at", "").strftime("%Y-%m-%d") if job.get("closed_at") else "",
            job.get("delivery_to_client_date", "").strftime("%Y-%m-%d") if job.get("delivery_to_client_date") else "",
            ", ".join(worker_names),
            round(profit_usd, 2)
        ]
        ws.append(row)
    wb.save(file_path)
    return FileResponse(file_path, filename=file_path.name)

def calculate_profit(job):
    usd_expenses = sum(
        float(exp.get("cost", {}).get("USD", 0)) for exp in job.get("expenses_part", [])
        )
    usd_sales = sum(
        float(sale.get("sale", {}).get("USD", 0)) for sale in job.get("sale_part", [])
    )
    return usd_sales - usd_expenses