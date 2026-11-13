"""
WSGI config for cytoml_proj project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cytoml_proj.settings')

application = get_wsgi_application()

# Carrega os modelos no boot do servidor (e não na primeira análise): assim o tempo de carga
# fica no início do container, e a primeira requisição já encontra a pipeline pronta.
from apps.analysis.services.models import get_pipeline  # noqa: E402

get_pipeline()
