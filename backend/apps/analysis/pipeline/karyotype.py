"""Replicado de https://github.com/irlvinicius/CytoML/blob/main/src/classification/karyotype.py
(só os imports mudaram).

Contagem por classe, alerta numérico e interpretação do cariótipo.

Regra do `karyotype_assembler.py` de Rosas-Alatriste et al. (Scientific Reports, 2026): 2
cromossomos por autossomo; se houver algum Y, o esperado é XY, senão XX. Qualquer classe com
contagem diferente do esperado vira um alerta -- é a base da detecção de aneuploidias (Fase 5).

Sobre o alerta:

- `interpret` traduz os desvios para a fórmula do cariótipo (notação ISCN simplificada, ex.:
  `47,XX,+21`) e para as alterações conhecidas (trissomias do 13, 18 e 21, Turner, Klinefelter...).
  Um caso é tratado à parte: com o total normal de 46, todo ganho vem acompanhado de uma perda (ex.:
  um 22 a mais e um 19 a menos). Isso quase sempre é um cromossomo classificado no tipo errado, e
  não uma aneuploidia, então vira "contagem inconsistente", para revisão.
- `assign_classes` decide as classes da metáfase em conjunto, em vez do argmax de cada recorte
  isolado: cada tipo tem 2 vagas "normais" (1 para o Y) e vagas extras que custam
  `extra_penalty` (em unidades de -log p). Um terceiro cromossomo do mesmo tipo só é aceito se a
  evidência para ele compensar a penalidade; senão o recorte vai para a sua próxima classe mais
  provável, de preferência uma com vaga livre. Com `extra_penalty=0` o resultado é o argmax.
"""

from collections import Counter
from dataclasses import dataclass

import numpy as np
from scipy.optimize import linear_sum_assignment

from .classes import DENVER_CLASSES

AUTOSOMES = [c for c in DENVER_CLASSES if c not in ("X", "Y")]
NORMAL_TOTAL = 46

NORMAL = "normal"
NUMERICAL = "alteração numérica"
INCONSISTENT = "contagem inconsistente"

AUTOSOMAL_SYNDROMES = {"D13": "Síndrome de Patau", "E18": "Síndrome de Edwards", "G21": "Síndrome de Down"}
SEX_FINDINGS = {
    (1, 0): "monossomia do X (Síndrome de Turner)",
    (2, 1): "XXY (Síndrome de Klinefelter)",
    (3, 0): "trissomia do X",
    (1, 2): "XYY",
}


def count_by_class(labels: list[str]) -> dict[str, int]:
    counts = Counter(labels)
    unknown = set(counts) - set(DENVER_CLASSES)
    if unknown:
        raise ValueError(f"classes desconhecidas: {sorted(unknown)}")
    return {c: counts.get(c, 0) for c in DENVER_CLASSES}


def expected_counts(observed: dict[str, int]) -> dict[str, int]:
    expected = {c: 2 for c in AUTOSOMES}
    if observed.get("Y", 0) > 0:
        expected.update(X=1, Y=1)
    else:
        expected.update(X=2, Y=0)
    return expected


def numerical_alerts(observed: dict[str, int]) -> dict[str, dict[str, int]]:
    """{classe: {"observed", "expected"}} para cada classe fora do esperado; vazio = cariótipo normal."""
    return {
        c: {"observed": observed.get(c, 0), "expected": e}
        for c, e in expected_counts(observed).items()
        if observed.get(c, 0) != e
    }


def pair_number(class_name: str) -> str:
    """'A1' -> '1', 'G21' -> '21', 'X' -> 'X'."""
    return class_name if class_name in ("X", "Y") else class_name[1:]


def karyotype_formula(counts: dict[str, int]) -> str:
    """Total, cromossomos sexuais e ganhos/perdas de autossomos: '46,XY', '47,XX,+21', '45,X'."""
    sex = "X" * counts["X"] + "Y" * counts["Y"] or "?"
    changes = []
    for c in AUTOSOMES:
        delta = counts[c] - 2
        sign = "+" if delta > 0 else "-"
        changes += [f"{sign}{pair_number(c)}"] * abs(delta)
    return ",".join([str(sum(counts.values())), sex, *changes])


@dataclass(frozen=True)
class Interpretation:
    formula: str
    status: str  # NORMAL, NUMERICAL ou INCONSISTENT
    findings: tuple[str, ...]


def _autosome_finding(class_name: str, observed: int) -> str:
    n = pair_number(class_name)
    if observed == 3:
        syndrome = AUTOSOMAL_SYNDROMES.get(class_name)
        return f"trissomia do {n}" + (f" ({syndrome})" if syndrome else "")
    if observed == 1:
        return f"monossomia do {n}"
    if observed == 0:
        return f"ausência do {n}"
    return f"{observed} cópias do {n}"


def interpret(counts: dict[str, int]) -> Interpretation:
    alerts = numerical_alerts(counts)
    formula = karyotype_formula(counts)
    if not alerts:
        return Interpretation(formula, NORMAL, ())

    gained = [pair_number(c) for c, a in alerts.items() if a["observed"] > a["expected"]]
    lost = [pair_number(c) for c, a in alerts.items() if a["observed"] < a["expected"]]
    if sum(counts.values()) == NORMAL_TOTAL:
        # o esperado também soma 46, então cada ganho tem uma perda correspondente
        finding = (
            f"{', '.join(gained)} a mais e {', '.join(lost)} a menos com {NORMAL_TOTAL} cromossomos: "
            "provável erro de classificação"
        )
        return Interpretation(formula, INCONSISTENT, (finding,))

    findings = [_autosome_finding(c, a["observed"]) for c, a in alerts.items() if c in AUTOSOMES]
    if "X" in alerts or "Y" in alerts:
        sex = (counts["X"], counts["Y"])
        findings.append(SEX_FINDINGS.get(sex, f"cromossomos sexuais {formula.split(',')[1]}"))
    if gained and lost:
        findings.append("ganhos e perdas na mesma metáfase: parte dos desvios pode ser erro de classificação")
    return Interpretation(formula, NUMERICAL, tuple(findings))


def assign_classes(probs: np.ndarray, extra_penalty: float, max_extra: int = 2) -> list[str]:
    """Classe de cada recorte de uma metáfase, decidida em conjunto (ver docstring do módulo).

    `probs` tem uma linha por recorte e uma coluna por classe (ordem de `DENVER_CLASSES`).
    Resolve a atribuição recorte -> vaga de menor custo total (algoritmo húngaro).
    """
    probs = np.asarray(probs, dtype=np.float64)
    if len(probs) == 0:
        return []
    slot_class, slot_cost = [], []
    for j, c in enumerate(DENVER_CLASSES):
        normal = 1 if c == "Y" else 2
        slot_class += [j] * (normal + max_extra)
        slot_cost += [0.0] * normal + [k * extra_penalty for k in range(1, max_extra + 1)]
    if len(probs) > len(slot_class):
        # mais recortes que vagas: não há como respeitar o limite, fica o argmax
        return [DENVER_CLASSES[i] for i in probs.argmax(axis=1)]

    cost = -np.log(np.clip(probs[:, slot_class], 1e-12, None)) + np.array(slot_cost)
    rows, slots = linear_sum_assignment(cost)
    labels = [""] * len(probs)
    for row, slot in zip(rows, slots, strict=True):
        labels[row] = DENVER_CLASSES[slot_class[slot]]
    return labels
