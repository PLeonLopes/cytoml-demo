from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser

from .serializers import AnalysisInputSerializer, AnalysisResultSerializer
from .services.yolo_service import run_inference

# Create your views here.

class AnalyzeImageView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        serializer = AnalysisInputSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        image_file = serializer.validated_data['image']

        try:
            result = run_inference(image_file)
        except Exception as e:
            return Response(
                {'error': f'Erro na inferência: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        output = AnalysisResultSerializer(result)
        return Response(output.data, status=status.HTTP_200_OK)


class HealthCheckView(APIView):
    """Endpoint simples para verificar se o serviço está vivo."""
    def get(self, request):
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)
