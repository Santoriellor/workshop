from rest_framework.pagination import LimitOffsetPagination


class CustomPagination(LimitOffsetPagination):
    """The page size used when a caller asks for pagination without a limit."""

    default_limit = 5
