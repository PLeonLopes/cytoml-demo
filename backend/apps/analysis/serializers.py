from rest_framework import serializers


class AnalysisInputSerializer(serializers.Serializer):
    image = serializers.ImageField()


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
