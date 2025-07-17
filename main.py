from fastapi import FastAPI
from routes.docs_routes import router as file_router
from routes.job_routers import router as job_router


app = FastAPI(title = "Work Manager")

app.include_router(file_router, prefix = "/files", tags=["Files"])
app.include_router(job_router, prefix = "/jobs", tags=["Jobs"])