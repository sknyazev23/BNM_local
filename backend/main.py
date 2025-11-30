from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING

# Routes
from routes.job_routers import router as job_router
from routes.worker_routes import router as worker_router
from routes.client_routes import router as client_router
from routes.documents_routes import router as doc_router
from routes.export_jobs import router as export_router

# Collections
from config import (
    jobs_collection,
    sales_collection,
    expenses_collection,
    documents_collection,
    clients_collection,
    workers_collection,
)

app = FastAPI(
    title="BN Manager API",
    description="Логистика | Продажи | Расходы | Документы",
    version="1.0.0"
)


@app.on_event("startup")
def _ensure_indexes():
    print("Запуск: создание и проверка индексов MongoDB...")

    # ====================== JOBS ======================
    jobs_collection.create_index([("BN_number", ASCENDING)], unique=True, name="unique_bn_number")

    jobs_collection.create_index([("archived", ASCENDING)], name="idx_archived")
    jobs_collection.create_index([("created_at", -1)], name="idx_created_desc")
    jobs_collection.create_index([("service_done", ASCENDING)], name="idx_service_done")
    jobs_collection.create_index([("client_name", "text")], name="text_client_name")

    # Комбинированные — для дашборда и фильтров
    jobs_collection.create_index([("archived", ASCENDING), ("created_at", -1)], name="idx_archived_created")



    # ====================== SALES ======================
    sales_collection.create_index([("job_id", ASCENDING)], name="sales_job_id")
    sales_collection.create_index([("sale_status", ASCENDING)], name="sales_status")
    sales_collection.create_index([("date_payment", ASCENDING)], name="sales_date_payment")

    # Комбинированные
    sales_collection.create_index([("job_id", ASCENDING), ("sale_status", ASCENDING)], name="sales_job_status")
    sales_collection.create_index([("job_id", ASCENDING), ("date_payment", -1)], name="sales_job_date_desc")
    sales_collection.create_index([("coworker_name", ASCENDING)], name="sales_coworker")


    # ====================== EXPENSES ======================
    expenses_collection.create_index([("job_id", ASCENDING)], name="exp_job_id")
    expenses_collection.create_index([("sale_status", ASCENDING)], name="exp_status")  # или expense_status
    expenses_collection.create_index([("date_payment_to_seller", ASCENDING)], name="exp_payment_date")

    expenses_collection.create_index([("job_id", ASCENDING), ("sale_status", ASCENDING)], name="exp_job_status")


    # ====================== CLIENTS ======================
    try:
        clients_collection.create_index([("name", ASCENDING)], name="client_name")
        clients_collection.create_index([("name", "text")], name="text_client_search")
    except NameError:
        print("clients_collection не найден — пропускаем индексы")


    # ====================== WORKERS ======================
    try:
        workers_collection.create_index([("name", ASCENDING)], name="worker_name")
        workers_collection.create_index([("status", ASCENDING)], name="worker_status")
    except NameError:
        print("workers_collection не найден — пропускаем индексы")

    # ====================== DOCUMENTS ======================
    documents_collection.create_index([("job_id", ASCENDING)], name="documents_job_id")
    documents_collection.create_index([("document_name", ASCENDING)], name="documents_name")
    documents_collection.create_index([("document_name", "text")], name="text_doc_name")
    documents_collection.create_index([("type", ASCENDING)], name="documents_type")
    documents_collection.create_index([("job_id", ASCENDING), ("created_at", -1)], name="documents_job_date_desc")
    documents_collection.create_index([("job_id", ASCENDING), ("type", ASCENDING)], name="documents_job_type")

    print("Все индексы успешно созданы и проверены!")


# ====================== CORS ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # сюда прод
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ====================== Роутеры ======================
app.include_router(job_router, prefix="/jobs", tags=["Jobs"])
app.include_router(worker_router, prefix="/workers", tags=["Workers"])
app.include_router(client_router, prefix="/clients", tags=["Clients"])
app.include_router(doc_router, prefix="/documents", tags=["Documents"])
app.include_router(export_router, tags=["Export"])


@app.get("/")
def root():
    return {"message": "BN Manager API запущен и готов к работе", "status": "ok"}