"""Testes dos endpoints `/api/analysis/health/` e `/api/analysis/analyze/`, com os modelos reais."""

import os
from pathlib import Path

import cv2
import numpy as np
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase

FIXTURES = Path(__file__).resolve().parent / "fixtures"
ANALYZE_URL = "/api/analysis/analyze/"


def png_upload(image: np.ndarray, name: str = "imagem.png") -> SimpleUploadedFile:
    ok, buffer = cv2.imencode(".png", image)
    assert ok
    return SimpleUploadedFile(name, buffer.tobytes(), content_type="image/png")


class HealthTests(SimpleTestCase):
    def test_health_reports_status(self):
        response = self.client.get("/api/analysis/health/")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["status"], "ok")
        self.assertIn("models_loaded", body["data"])


class AnalyzeTests(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # 1053722 (teste): anotação 47,XX,+21, uma das 7 aneuploidias do artigo
        data = (FIXTURES / "1053722.jpg").read_bytes()
        upload = SimpleUploadedFile("1053722.jpg", data, content_type="image/jpeg")
        cls.response = cls.client_class().post(ANALYZE_URL, {"image": upload})

    def test_trisomy_21_metaphase(self):
        self.assertEqual(self.response.status_code, 200)
        karyotype = self.response.json()["data"]["karyotype"]
        self.assertEqual(karyotype["formula"], "47,XX,+21")
        self.assertEqual(karyotype["status_code"], "numerical")
        self.assertEqual(karyotype["findings"], ["trissomia do 21 (Síndrome de Down)"])
        self.assertEqual(karyotype["total"], 47)
        self.assertEqual(karyotype["alerts"], {"G21": {"observed": 3, "expected": 2}})

    def test_response_schema(self):
        body = self.response.json()
        self.assertTrue(body["success"])
        self.assertIsNone(body["error"])
        data = body["data"]
        self.assertEqual(set(data), {"karyotype", "chromosomes", "images", "timing_ms", "model", "warnings"})
        self.assertEqual(len(data["karyotype"]["counts"]), 24)
        self.assertEqual(len(data["chromosomes"]), data["karyotype"]["total"])
        self.assertEqual(
            set(data["chromosomes"][0]),
            {"id", "bbox", "detection_confidence", "class_name", "pair", "class_probability"},
        )
        self.assertTrue(data["images"]["preprocessed"].startswith("data:image/jpeg;base64,"))
        self.assertTrue(data["images"]["annotated"].startswith("data:image/jpeg;base64,"))
        self.assertTrue(data["images"]["karyogram"].startswith("data:image/png;base64,"))
        self.assertEqual(set(data["timing_ms"]), {"preprocess", "inference", "render", "total"})
        self.assertEqual(data["warnings"], [])

    def test_blank_image_has_no_detections(self):
        blank = np.full((800, 800, 3), 255, dtype=np.uint8)
        response = self.client.post(ANALYZE_URL, {"image": png_upload(blank)})
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["karyotype"]["status_code"], "no_detections")
        self.assertEqual(data["chromosomes"], [])
        self.assertIsNone(data["images"]["karyogram"])
        self.assertEqual(len(data["warnings"]), 1)

    def test_corrupted_image_is_rejected(self):
        upload = SimpleUploadedFile("corrompida.jpg", os.urandom(5000), content_type="image/jpeg")
        response = self.client.post(ANALYZE_URL, {"image": upload})
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertFalse(body["success"])
        self.assertEqual(body["error"]["message"]["code"], "INVALID_IMAGE")

    def test_non_image_file_is_rejected(self):
        upload = SimpleUploadedFile("texto.txt", b"oi", content_type="text/plain")
        response = self.client.post(ANALYZE_URL, {"image": upload})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["success"])
