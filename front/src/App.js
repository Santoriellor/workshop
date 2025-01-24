import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Reports from "./pages/Reports";
import Bills from "./pages/Bills";
import Clients from "./pages/Clients";
import "./App.css";

const App = () => {
  return (
    <Router>
      <Sidebar />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/clients" element={<Clients />} />
      </Routes>
    </Router>
  );
};

export default App;
