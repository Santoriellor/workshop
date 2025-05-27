import os
from decimal import Decimal
from django.conf import settings
from django.core.files.base import ContentFile
from django.template.loader import get_template
from weasyprint import HTML

from api.models import Invoice, Task, Part

def generate_invoice(report, request=None):
    invoice_number = f"INV-{report.id:06d}"
    invoice = Invoice.objects.create(invoice_number=invoice_number, report=report)

    html_content = generate_invoice_pdf(invoice)

    if settings.IS_DOCKER:
        base_url = "http://react_nginx/"
    else:
        base_url = request.build_absolute_uri(settings.STATIC_URL) if request else "/"

    pdf_file = HTML(string=html_content, base_url=base_url).write_pdf()

    os.makedirs(os.path.join(settings.MEDIA_ROOT, 'invoices'), exist_ok=True)
    invoice.pdf.save(f"invoice_{invoice_number}.pdf", ContentFile(pdf_file), save=True)

    return invoice

def generate_invoice_pdf(invoice):
    tasks = Task.objects.filter(report=invoice.report).select_related('task_template')
    parts = Part.objects.filter(report=invoice.report).select_related('part')

    VAT_RATE = Decimal("0.2")
    task_data, part_data = [], []
    net_total = Decimal("0.00")

    for task in tasks:
        price = task.task_template.price
        vat = price * VAT_RATE
        task_data.append({
            "name": task.task_template.name,
            "price": f"{price:.2f}",
            "vat": f"{vat:.2f}",
            "total": f"{(price + vat):.2f}",
        })
        net_total += price

    for part in parts:
        unit_price = part.part.unit_price
        quantity = part.quantity_used
        subtotal = unit_price * quantity
        vat = subtotal * VAT_RATE
        part_data.append({
            "name": part.part.name,
            "unit_price": f"{unit_price:.2f}",
            "quantity": str(quantity),
            "subtotal": f"{subtotal:.2f}",
            "vat": f"{vat:.2f}",
            "total": f"{(subtotal + vat):.2f}",
        })
        net_total += subtotal

    vat_total = net_total * VAT_RATE
    final_total = net_total + vat_total

    context = {
        "invoice": invoice,
        "tasks": task_data,
        "parts": part_data,
        "net_total": f"{net_total:.2f}",
        "vat_total": f"{vat_total:.2f}",
        "final_total": f"{final_total:.2f}",
    }

    template = get_template("api/invoice_template.html")
    return template.render(context)
