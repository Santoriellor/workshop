from rest_framework.response import Response

from .pagination import CustomPagination


class OptionalPaginationMixin:
    """List endpoints that return a bare array unless the caller asks for a page.

    ReportViewSet, InventoryViewSet and InvoiceViewSet each carried a private
    copy of this, identical apart from the default ordering. Set
    `default_ordering` to the ordering applied when the caller supplies none.

    The originals assigned `self.pagination_class` before paginating. That was a
    per-request side effect on the view instance and is not reproduced; the
    paginator is constructed directly instead.
    """

    default_ordering = "id"

    def list(self, request, *args, **kwargs):
        # `.get(key, default)` only substitutes `default_ordering` when the
        # key is absent - a present-but-blank `ordering=` reaches here as
        # `''` and would otherwise become `order_by('')`, which raises
        # FieldError. `or` catches that case too, and the second step drops
        # any blank/whitespace-only segments (e.g. "name,," or ",") so a
        # value that's all separators also falls back cleanly. The fallback
        # itself goes through the same comma split, since default_ordering
        # (e.g. "vehicle__brand,vehicle__model") can be more than one field.
        raw = request.query_params.get("ordering") or self.default_ordering
        fields = [field.strip() for field in raw.split(",") if field.strip()]
        if not fields:
            fields = self.default_ordering.split(",")
        queryset = self.filter_queryset(self.get_queryset()).order_by(*fields)

        if request.query_params.get("limit") or request.query_params.get("offset"):
            paginator = CustomPagination()
            page = paginator.paginate_queryset(queryset, request)
            return paginator.get_paginated_response(self.get_serializer(page, many=True).data)

        return Response(self.get_serializer(queryset, many=True).data)
