from rest_framework import serializers


class AnalysisInputSerializer(serializers.Serializer):
    image = serializers.ImageField()


class DetectionSerializer(serializers.Serializer):
    class_id    = serializers.IntegerField()
    class_name  = serializers.CharField()
    confidence  = serializers.FloatField()
    bbox        = serializers.ListField(child=serializers.FloatField())


class AnalysisResultSerializer(serializers.Serializer):
    annotated_image  = serializers.CharField()   # base64
    total_detections = serializers.IntegerField()
    avg_accuracy     = serializers.FloatField()
    detections       = DetectionSerializer(many=True)