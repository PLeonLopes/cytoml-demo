from rest_framework import serializers

ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'bmp', 'tiff', 'webp']
MAX_SIZE_MB = 10
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

ALLOWED_CONTENT_TYPES = [
    'image/jpeg', 'image/png', 'image/bmp',
    'image/tiff', 'image/webp',
]


class AnalysisInputSerializer(serializers.Serializer):
    image = serializers.FileField() 

    def validate_image(self, image):
        if image.content_type not in ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError(
                f"Tipo '{image.content_type}' não permitido. "
                f"Envie uma imagem: jpeg, png, bmp, tiff ou webp."
            )

        ext = image.name.rsplit('.', 1)[-1].lower()
        if ext not in ALLOWED_FORMATS:
            raise serializers.ValidationError(
                f"Formato '{ext}' não suportado. "
                f"Use: {', '.join(ALLOWED_FORMATS)}."
            )
        
        if image.size > MAX_SIZE_BYTES:
            raise serializers.ValidationError(
                f"Arquivo muito grande. Tamanho máximo permitido: {MAX_SIZE_MB}MB."
            )

        return image



class DetectionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    class_id = serializers.IntegerField()
    class_name = serializers.CharField()
    confidence = serializers.FloatField()
    bbox = serializers.ListField(child=serializers.FloatField())


class AnalysisSummarySerializer(serializers.Serializer):
    total_detections = serializers.IntegerField()
    inference_time_ms = serializers.FloatField()
    avg_confidence = serializers.FloatField()
    min_confidence = serializers.FloatField()
    max_confidence = serializers.FloatField()


class AnalysisResultSerializer(serializers.Serializer):
    annotated_image = serializers.CharField()
    analysis = AnalysisSummarySerializer()
    detections = DetectionSerializer(many=True)
