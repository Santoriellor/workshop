import React from "react";

// Components
import LatestReports from "../components/LatestReports";
import LowestInventory from "../components/LowestInventory";
import LatestVehicles from "../components/LatestVehicles";
import ScrollToTopButton from "../components/ScrollToTopButton";
// Contexts
import { useAuth } from "../contexts/AuthContext";
// Styles
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { authenticatedUser } = useAuth();

  return (
    <>
      <h2>Dashboard - You are logged in as {authenticatedUser.username}</h2>
      <div className="dashboard">
        <section className="latest-reports">
          <LatestReports />
        </section>
        <div className="divider"></div>
        <section className="lowest-inventory">
          <LowestInventory />
        </section>
        <div className="divider"></div>
        <section className="latest-vehicles">
          <LatestVehicles />
        </section>
      </div>
      {/* Floating ScrollToTopButton */}
      <ScrollToTopButton />
    </>
  );
};

export default Dashboard;
