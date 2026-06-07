from rest_framework.response import Response


class StandardResponseMixin:
    """
    Mixin que padroniza todas as respostas da view no formato:
    { "success": bool, "data": ..., "error": ... }
    """

    def finalize_response(self, request, response, *args, **kwargs):
        if isinstance(response.data, dict) and "success" in response.data:
            # Já está no formato padrão (ex: veio do exception handler)
            return super().finalize_response(request, response, *args, **kwargs)

        success = response.status_code < 400

        if success:
            response.data = {
                "success": True,
                "data": response.data,
                "error": None,
            }
        else:
            response.data = {
                "success": False,
                "data": None,
                "error": {
                    "code": self._resolve_error_code(response.status_code),
                    "message": response.data,
                },
            }

        return super().finalize_response(request, response, *args, **kwargs)

    @staticmethod
    def _resolve_error_code(status_code: int) -> str:
        return {
            400: "INVALID_INPUT",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            500: "INTERNAL_ERROR",
        }.get(status_code, "ERROR")
