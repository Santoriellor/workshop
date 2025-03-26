import React, { createContext, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";

// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import withSuccessAlert from "../utils/successAlert";

const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
  const location = useLocation();
  const {
    data: invoices,
    fetchData: fetchInvoices,
    createItem: createInvoice,
    updateItem: updateInvoice,
    deleteItem: deleteInvoice,
    loading: loadingInvoices,
    error: errorInvoices,
  } = useCRUD("invoices");

  // Create a invoice with success alert
  const createInvoiceWithAlert = withSuccessAlert(
    createInvoice,
    "Invoice created successfully!"
  );
  // Update a invoice with success alert
  const updateInvoiceWithAlert = withSuccessAlert(
    updateInvoice,
    "Invoice updated successfully!"
  );
  // Delete a invoice with success alert
  const deleteInvoiceWithAlert = withSuccessAlert(
    deleteInvoice,
    "Invoice deleted successfully!"
  );

  // Automatically fetch data when pathname changes
  useEffect(() => {
    const invoicesPaths = ["/invoices", "/dashboard"];
    if (invoicesPaths.includes(location.pathname)) {
      let filters = {};
      let ordering = null;
      let limit = null;
      let offset = null;

      if (location.pathname.includes("invoices")) {
        ordering = "-issued_date";
      }
      if (location.pathname.includes("dashboard")) {
        ordering = "-issued_date";
        limit = 5;
      }

      fetchInvoices({ ...filters, ordering, limit, offset });
    }
  }, [location.pathname, invoices.length]);

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        fetchInvoices,
        createInvoiceWithAlert,
        updateInvoiceWithAlert,
        deleteInvoiceWithAlert,
        loadingInvoices,
        errorInvoices,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};

// Custom hook for accessing the InvoiceContext
export const useInvoiceContext = () => useContext(InvoiceContext);
