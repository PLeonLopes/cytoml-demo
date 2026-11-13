import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .mixins import StandardResponseMixin
from .serializers import AnalysisInputSerializer
from .services.analysis import analyze
from .services.models import models_loaded

logger = logging.getLogger(__name__)

# Create your views here.

class AnalyzeImageView(StandardResponseMixin, APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = AnalysisInputSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        image_file = serializer.validated_data["image"]

        try:
            result = analyze(image_file.read())
        except ValueError as e:
            return Response(
                {"code": "INVALID_IMAGE", "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            logger.exception("Erro na análise da imagem")
            return Response(
                {"code": "INFERENCE_ERROR", "message": "Erro interno ao analisar a imagem."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(result, status=status.HTTP_200_OK)


class HealthCheckView(StandardResponseMixin, APIView):
    def get(self, request):
        return Response({"status": "ok", "models_loaded": models_loaded()}, status=status.HTTP_200_OK)
