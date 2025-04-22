// Zustand
import useInvoiceStore from '../../stores/useInvoiceStore'
// Components
import InvoiceCard from './InvoiceCard'

const LatestInvoices = () => {
  const { invoices, loading } = useInvoiceStore()

  return (
    <>
      <h3>Latest Invoices</h3>
      {/* latest invoices list with card display */}
      <div className="list">
        {loading ? (
          <p>Loading invoices...</p>
        ) : invoices.length > 0 ? (
          invoices.map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} />)
        ) : (
          <p>No invoices found.</p>
        )}
      </div>
    </>
  )
}
export default LatestInvoices
