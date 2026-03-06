from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional

from app.services.pdf_service import DocumentService
from app.services.similarity_service import SimilarityService
from app.pipelines.evaluation_pipeline import EvaluationPipeline
from app.code_evaluation.pipeline import CodeEvaluationPipeline
from app.code_evaluation.code_extractor import CodeExtractor
from app.code_evaluation.dom_pipeline import DOMCodeEvaluationPipeline

router = APIRouter()

doc_service = DocumentService()
code_extractor = CodeExtractor()


class EvaluateRequest(BaseModel):
    student_file: str
    guide_file: str


class CompareRequest(BaseModel):
    file1: str
    file2: str


# UNIFIED EVALUATION ENDPOINT
@router.post("/evaluate")
def evaluate(request: EvaluateRequest, req: Request):

    student_path = request.student_file
    guide_path = request.guide_file

    guide_text = doc_service.extract_text(guide_path)

    # AUTO DETECTION
    if "Full Marks:" in guide_text or "Compile:" in guide_text:
        pipeline = DOMCodeEvaluationPipeline(
            submission_file=student_path,
            answer_sheet_file=guide_path
        )
        return pipeline.run()

    else:
        similarity_service = SimilarityService(req.app.state.similarity_model)

        pipeline = EvaluationPipeline(
            student_file=student_path,
            guide_file=guide_path,
            similarity_service=similarity_service
        )

        return pipeline.run()


# SEPARATE COMPARE ENDPOINT (UTILITY)

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