from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.job_routers import router as job_router
from routes.worker_routes import router as worker_router
from routes.client_routes import router as client_router
from routes.docs_routes import router as doc_router
from routes.export_jobs import router as export_router
from pymongo import ASCENDING
from config import jobs_collection, sales_collection, expenses_collection, docs_collection



app = FastAPI(title = "Work Manager API")

@app.on_event("startup")
def _ensure_indexes():
    # Jobs
    jobs_collection.create_index([("main_part.bn_number", ASCENDING)], unique=True)
    jobs_collection.create_index([("status", ASCENDING)])

    jobs_collection.create_index([("main_part.client_name", "text")])
    jobs_collection.create_index([("main_part.created_at", ASCENDING)])

    # Sales
    sales_collection.create_index([("job_id", ASCENDING)])
    sales_collection.create_index([("worker_ids", ASCENDING)])
    sales_collection.create_index([("expense_ids", ASCENDING)])

    # Expenses
    expenses_collection.create_index([("job_id", ASCENDING)])
    expenses_collection.create_index([("worker_ids", ASCENDING)])
    expenses_collection.create_index([("sale_id", ASCENDING)])

    # Docs
    docs_collection.create_index([("job_id", ASCENDING)])
    docs_collection.create_index([("upload_date", ASCENDING)])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(job_router, prefix="/jobs", tags=["Jobs"])
app.include_router(worker_router, prefix="/workers", tags=["Workers"])
app.include_router(client_router, prefix="/clients", tags=["Clients"])
app.include_router(doc_router, prefix="/docs", tags=["Documents"])
app.include_router(export_router)


@app.get("/")
def root():
    return{"message": "Work Manager API is runing"}