import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
// Components
import Sidebar from "./components/Sidebar";
import Login from "./components/authentication/Login";
import Register from "./components/authentication/Register";
import PrivateRoute from "./components/authentication/PrivateRoute";
import DeleteModal from "./components/DeleteModal";
// Pages
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import Owner from "./pages/Owner";
import Vehicle from "./pages/Vehicle";
import Invoices from "./pages/Invoices";
import Inventory from "./pages/Inventory";
import TaskTemplate from "./pages/TaskTemplate";
// Contexts
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { GlobalProvider, useGlobalContext } from "./contexts/GlobalContext";
import { ReportProvider } from "./contexts/ReportContext";
import { OwnerProvider } from "./contexts/OwnerContext";
import { VehicleProvider } from "./contexts/VehicleContext";
import { InventoryProvider } from "./contexts/InventoryContext";
import { InvoiceProvider } from "./contexts/InvoiceContext";
// Styles
import "./App.css";
import "./styles/Buttons.css";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <GlobalProvider>
          <Main />
        </GlobalProvider>
      </AuthProvider>
    </Router>
  );
};

const Main = () => {
  const { authenticatedUser, loadingAuth } = useAuth();
  const { modalState, deleteItemWithAlert } = useGlobalContext();
  const ModalComponent = modalState.modalComponent;

  if (loadingAuth) return <p>Loading...</p>;

  return (
    <UserProvider>
      {authenticatedUser ? (
        <VehicleProvider>
          <OwnerProvider>
            <ReportProvider>
              <InventoryProvider>
                <InvoiceProvider>
                  <div className="container">
                    <div className="left-menu">
                      <Sidebar />
                    </div>
                    <div className="main">
                      <div className="content">
                        <Routes>
                          {/* Private Routes */}
                          <Route element={<PrivateRoute />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/report" element={<Report />} />
                            <Route path="/owner" element={<Owner />} />
                            <Route path="/vehicle" element={<Vehicle />} />
                            <Route path="/invoices" element={<Invoices />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route
                              path="/tasktemplate"
                              element={<TaskTemplate />}
                            />
                          </Route>

                          {/* Redirect to dashboard by default */}
                          <Route
                            path="*"
                            element={<Navigate to="/dashboard" />}
                          />
                        </Routes>
                      </div>
                    </div>
                  </div>
                  {modalState.isModalReady &&
                    modalState.showModal &&
                    ModalComponent && <ModalComponent />}

                  {modalState.showDeleteModal && <DeleteModal />}
                </InvoiceProvider>
              </InventoryProvider>
            </ReportProvider>
          </OwnerProvider>
        </VehicleProvider>
      ) : (
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </UserProvider>
  );
};

export default App;
