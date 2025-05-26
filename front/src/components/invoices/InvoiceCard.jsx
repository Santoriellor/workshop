import { useLocation } from 'react-router-dom'

const InvoiceCard = ({ invoice }) => {
  const location = useLocation()
  const isPathDashboard = location.pathname.includes('invoices')

  return (
    <a
      href={invoice.pdf ? invoice.pdf : '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="card-invoice"
      title="Open invoice PDF"
    >
      <section key={invoice.id}>
        <header>
          {invoice.invoice_number} - {invoice.owner_full_name || 'Owner unknown'} (
          {invoice.vehicle_plate || 'Plate unknown'})
        </header>
        <div className={isPathDashboard ? 'card-invoice-col' : 'card-invoice-row'}>
          <p>Issued: {invoice.formatted_issued_date}</p>
          <p>Total Cost: {invoice.total_cost} CHF</p>

          <p>{invoice.pdf ? `Invoice number: ${invoice.invoice_number}` : 'No file found'}</p>
        </div>
      </section>
    </a>
  )
}
export default InvoiceCard
