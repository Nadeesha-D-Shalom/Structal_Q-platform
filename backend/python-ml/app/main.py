from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from app.api import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def load_model():
    print("Loading similarity model...")
    app.state.similarity_model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Model loaded successfully.")

app.include_router(router)