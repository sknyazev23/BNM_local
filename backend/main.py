from fastapi import FastAPI
from routes.job_routers import router as job_router
from routes.worker_routes import router as worker_router
from routes.client_routes import router as client_router
from routes.docs_routes import router as doc_router


app = FastAPI(title = "Work Manager API")

app.include_router(job_router, prefix="/jobs", tags=["Jobs"])
app.include_router(worker_router, prefix="/workers", tags=["Workers"])
app.include_router(client_router, prefix="/clients", tags=["Clients"])
app.include_router(doc_router, prefix="/docs", tags=["Documents"])

@app.get("/")
def root():
    return{"message": "Work Manager API is runing"}