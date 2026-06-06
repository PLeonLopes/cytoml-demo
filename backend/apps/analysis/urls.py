from django.urls import path
from .views import AnalyzeImageView, HealthCheckView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('analyze/', AnalyzeImageView.as_view(), name='analyze-image'),
]
