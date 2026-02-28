from fastapi import APIRouter
from pydantic import BaseModel
from app.pipelines.evaluation_pipeline import EvaluationPipeline

router = APIRouter()


class EvaluateRequest(BaseModel):
    student_file: str
    guide_file: str


@router.post("/evaluate")
def evaluate(request: EvaluateRequest):
    pipeline = EvaluationPipeline(
        student_file=request.student_file,
        guide_file=request.guide_file
    )
    return pipeline.run()