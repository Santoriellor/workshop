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

    default_ordering = 'id'

    def list(self, request, *args, **kwargs):
        ordering = request.query_params.get('ordering', self.default_ordering)
        queryset = self.filter_queryset(self.get_queryset()).order_by(*ordering.split(','))

        if request.query_params.get('limit') or request.query_params.get('offset'):
            paginator = CustomPagination()
            page = paginator.paginate_queryset(queryset, request)
            return paginator.get_paginated_response(
                self.get_serializer(page, many=True).data
            )

        return Response(self.get_serializer(queryset, many=True).data)
