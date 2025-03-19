// Contexts
import { useInvoiceContext } from "../../contexts/InvoiceContext";
// Components
import InvoiceCard from "./InvoiceCard";

const LatestInvoices = () => {
  const { invoices, loadingInvoices } = useInvoiceContext();

  /* const fetchLatestInvoices = (invoices) => {
    return invoices
      .sort((a, b) => new Date(b.issued_date) - new Date(a.issued_date))
      .slice(0, 5);
  };
  let latestInvoices = fetchLatestInvoices(invoices); */

  return (
    <>
      <h3>Latest Invoices</h3>
      {/* latest invoices list with card display */}
      <div className="list">
        {loadingInvoices ? (
          <p>Loading invoices...</p>
        ) : invoices.length > 0 ? (
          invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))
        ) : (
          <p>No invoices found.</p>
        )}
      </div>
    </>
  );
};
export default LatestInvoices;
