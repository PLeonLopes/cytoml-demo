from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "success": False,
            "data": None,
            "error": {
                "code": "INVALID_INPUT" if response.status_code < 500 else "INTERNAL_ERROR",
                "message": response.data,
            },
        }
    return response
