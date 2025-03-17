import React, { createContext, useEffect, useContext } from "react";

// Hooks
import useCRUD from "../hooks/useCRUD";
// Utils
import withSuccessAlert from "../utils/successAlert";

const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
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

  // Automatically fetch data on first load
  useEffect(() => {
    fetchInvoices({}, "issued_date");
  }, []);

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
