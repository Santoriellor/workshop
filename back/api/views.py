from rest_framework import viewsets
from .models import User, Client, Report
from .serializers import UserSerializer, ClientSerializer, ReportSerializer
from django.http import HttpResponse
from reportlab.pdfgen import canvas

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    
def export_report(request, report_id):
    try:
        report = Report.objects.get(id=report_id)  # Get the specific report
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="report_{report_id}.pdf"'

        # Generate PDF content
        p = canvas.Canvas(response)
        p.drawString(100, 800, f"Report: {report.title}")
        p.drawString(100, 780, f"Description: {report.description}")
        p.drawString(100, 760, f"Status: {report.status}")
        p.save()

        return response
    except Report.DoesNotExist:
        return HttpResponse("Report not found.", status=404)
