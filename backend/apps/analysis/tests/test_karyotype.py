"""Testes da contagem, da interpretação e da restrição λ.

Replicados de https://github.com/irlvinicius/CytoML/blob/main/tests/test_karyotype.py
(mesmos casos, adaptados de pytest para unittest: cada `parametrize` virou um `subTest`).
Garantem que a cópia de `pipeline/karyotype.py` não divergiu do CytoML.
"""

from unittest import TestCase

import numpy as np

from apps.analysis.pipeline.classes import DENVER_CLASSES
from apps.analysis.pipeline.karyotype import (
    INCONSISTENT,
    NORMAL,
    NUMERICAL,
    assign_classes,
    count_by_class,
    interpret,
    karyotype_formula,
)


def karyotype(sex: str, **changes: int) -> dict[str, int]:
    counts = {c: 2 for c in DENVER_CLASSES if c not in ("X", "Y")}
    counts.update(X=sex.count("X"), Y=sex.count("Y"))
    return counts | changes


def one_hot_probs(labels: list[str], confidence: float = 0.98) -> np.ndarray:
    probs = np.full((len(labels), len(DENVER_CLASSES)), (1 - confidence) / (len(DENVER_CLASSES) - 1))
    for i, label in enumerate(labels):
        probs[i, DENVER_CLASSES.index(label)] = confidence
    return probs


def normal_labels(sex: str = "XX") -> list[str]:
    return [c for c in DENVER_CLASSES if c not in ("X", "Y") for _ in range(2)] + list(sex)


class InterpretTests(TestCase):
    def test_karyotype_formula(self):
        cases = [
            (karyotype("XY"), "46,XY"),
            (karyotype("XX", G21=3), "47,XX,+21"),
            (karyotype("X"), "45,X"),
            (karyotype("XXY"), "47,XXY"),
            (karyotype("XY", A1=1, C7=4), "47,XY,-1,+7,+7"),
            (karyotype(""), "44,?"),
        ]
        for counts, formula in cases:
            with self.subTest(formula=formula):
                self.assertEqual(karyotype_formula(counts), formula)

    def test_normal_karyotype_has_no_findings(self):
        for sex in ["XX", "XY"]:
            with self.subTest(sex=sex):
                result = interpret(karyotype(sex))
                self.assertEqual(result.status, NORMAL)
                self.assertEqual(result.findings, ())

    def test_known_aneuploidies(self):
        cases = [
            (karyotype("XY", G21=3), "trissomia do 21 (Síndrome de Down)"),
            (karyotype("XX", E18=3), "trissomia do 18 (Síndrome de Edwards)"),
            (karyotype("XX", D13=3), "trissomia do 13 (Síndrome de Patau)"),
            (karyotype("XY", E16=3), "trissomia do 16"),
            (karyotype("XX", C7=1), "monossomia do 7"),
            (karyotype("X"), "monossomia do X (Síndrome de Turner)"),
            (karyotype("XXY"), "XXY (Síndrome de Klinefelter)"),
            (karyotype("XXX"), "trissomia do X"),
            (karyotype("XYY"), "XYY"),
        ]
        for counts, finding in cases:
            with self.subTest(finding=finding):
                result = interpret(counts)
                self.assertEqual(result.status, NUMERICAL)
                self.assertEqual(result.findings, (finding,))

    def test_gain_and_loss_with_46_is_inconsistent_not_aneuploidy(self):
        # um 19 classificado como 22: 22 a mais, 19 a menos, total ainda 46
        result = interpret(karyotype("XX", F19=1, G22=3))
        self.assertEqual(result.status, INCONSISTENT)
        self.assertEqual(result.formula, "46,XX,-19,+22")
        self.assertIn("provável erro de classificação", result.findings[0])

    def test_missing_y_classified_as_autosome_is_inconsistent(self):
        # XY com o Y classificado como 22: sem Y o esperado vira XX, e o X único parece uma perda
        result = interpret(karyotype("X", G22=3))
        self.assertEqual(result.status, INCONSISTENT)

    def test_trisomy_with_extra_swap_is_reported_with_warning(self):
        result = interpret(karyotype("XX", G21=3, F19=1, G22=3))
        self.assertEqual(result.status, NUMERICAL)
        self.assertIn("trissomia do 21 (Síndrome de Down)", result.findings)
        self.assertTrue(any("erro de classificação" in f for f in result.findings))


class AssignClassesTests(TestCase):
    def test_zero_penalty_matches_argmax(self):
        # probabilidades aleatórias, mas com o argmax de cada recorte em um cariótipo 46,XY
        rng = np.random.default_rng(0)
        labels = list(rng.permutation(normal_labels("XY")))
        probs = rng.dirichlet(np.ones(len(DENVER_CLASSES)), size=len(labels))
        probs[np.arange(len(labels)), [DENVER_CLASSES.index(c) for c in labels]] += 1
        probs /= probs.sum(axis=1, keepdims=True)
        self.assertEqual(assign_classes(probs, extra_penalty=0.0), labels)

    def test_uncertain_extra_chromosome_moves_to_free_slot(self):
        labels = normal_labels()
        probs = one_hot_probs(labels)
        # um dos 19 parece um 22 (55%), mas o 19 é a segunda opção (40%)
        swapped = labels.index("F19")
        probs[swapped] = 0.05 / 22
        probs[swapped, DENVER_CLASSES.index("G22")] = 0.55
        probs[swapped, DENVER_CLASSES.index("F19")] = 0.40

        argmax = assign_classes(probs, extra_penalty=0.0)
        self.assertEqual(interpret(count_by_class(argmax)).status, INCONSISTENT)
        constrained = assign_classes(probs, extra_penalty=1.0)
        self.assertEqual(interpret(count_by_class(constrained)).status, NORMAL)

    def test_confident_trisomy_survives_the_penalty(self):
        probs = one_hot_probs(normal_labels() + ["G21"])
        labels = assign_classes(probs, extra_penalty=2.0)
        self.assertEqual(interpret(count_by_class(labels)).findings, ("trissomia do 21 (Síndrome de Down)",))

    def test_assign_classes_handles_empty_and_oversized_metaphases(self):
        self.assertEqual(assign_classes(np.empty((0, len(DENVER_CLASSES))), extra_penalty=1.0), [])
        probs = one_hot_probs(["A1"] * 120)
        self.assertEqual(assign_classes(probs, extra_penalty=1.0), ["A1"] * 120)
