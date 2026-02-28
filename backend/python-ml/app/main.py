from fastapi import FastAPI
from app.api import router

app = FastAPI(
    title="StructaIQ Evaluation Service",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.include_router(router)


@app.get("/")
def root():
    return {"status": "running"}