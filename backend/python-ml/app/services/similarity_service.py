from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


class SimilarityService:

    def __init__(self, model):
        self.model = model

    def compute_similarity(self, text1: str, text2: str) -> float:

        if not text1.strip() or not text2.strip():
            return 0.0

        emb1 = self.model.encode([text1])
        emb2 = self.model.encode([text2])

        score = cosine_similarity(emb1, emb2)[0][0]

        return float(round(score, 4))