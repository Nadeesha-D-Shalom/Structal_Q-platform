from fastapi import APIRouter, Request
from pydantic import BaseModel
from app.pipelines.evaluation_pipeline import EvaluationPipeline
from app.services.pdf_service import DocumentService
from app.services.similarity_service import SimilarityService

router = APIRouter()

class EvaluateRequest(BaseModel):
    student_file: str
    guide_file: str

class CompareRequest(BaseModel):
    file1: str
    file2: str

doc_service = DocumentService()

@router.post("/evaluate")
def evaluate(request: EvaluateRequest, req: Request):

    similarity_service = SimilarityService(req.app.state.similarity_model)

    pipeline = EvaluationPipeline(
        student_file=request.student_file,
        guide_file=request.guide_file,
        similarity_service=similarity_service
    )

    return pipeline.run()

@router.post("/compare")
def compare_files(request: CompareRequest, req: Request):

    similarity_service = SimilarityService(req.app.state.similarity_model)

    text1 = doc_service.extract_text(request.file1)
    text2 = doc_service.extract_text(request.file2)

    similarity_score = similarity_service.compute_similarity(text1, text2)

    return {
        "similarity_score": similarity_score,
        "interpretation": interpret_similarity(similarity_score)
    }

def interpret_similarity(score: float):
    if score >= 0.90:
        return "Very High Similarity (Possible Copying)"
    elif score >= 0.75:
        return "High Similarity"
    elif score >= 0.60:
        return "Moderate Similarity"
    else:
        return "Low Similarity"