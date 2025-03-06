import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
// Components
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import Register from "./components/Register";
import PrivateRoute from "./components/PrivateRoute";
// Pages
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import Owner from "./pages/Owner";
import Vehicle from "./pages/Vehicle";
import Invoices from "./pages/Invoices";
import Inventory from "./pages/Inventory";
// Contexts
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { GlobalProvider } from "./contexts/GlobalContext";
import { ReportProvider } from "./contexts/ReportContext";
import { OwnerProvider } from "./contexts/OwnerContext";
import { VehicleProvider } from "./contexts/VehicleContext";
import { InventoryProvider } from "./contexts/InventoryContext";
import "./App.css";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Main />
      </AuthProvider>
    </Router>
  );
};

const Main = () => {
  const { authenticatedUser, loadingAuth } = useAuth();

  return (
    <UserProvider>
      {authenticatedUser ? (
        <GlobalProvider>
          <VehicleProvider>
            <OwnerProvider>
              <ReportProvider>
                <InventoryProvider>
                  <div className="container">
                    <div className="sidebar">
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
                          </Route>

                          {/* Redirect to login by default */}
                          <Route
                            path="*"
                            element={<Navigate to="/dashboard" />}
                          />
                        </Routes>
                      </div>
                    </div>
                  </div>
                </InventoryProvider>
              </ReportProvider>
            </OwnerProvider>
          </VehicleProvider>
        </GlobalProvider>
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
