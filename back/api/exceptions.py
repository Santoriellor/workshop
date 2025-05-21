from rest_framework.exceptions import APIException

class ConflictException(APIException):
    status_code = 409
    default_code = "conflict"
    
    def __init__(self, detail=None):
        if detail is None:
            detail = "This data has been modified by someone else. Please refresh."
        super().__init__(detail)
