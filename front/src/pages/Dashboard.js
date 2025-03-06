import React from "react";
import "../styles/Dashboard.css";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { authenticatedUser } = useAuth();

  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      {authenticatedUser && (
        <>
          <p>You are logged in as {authenticatedUser.username}</p>
        </>
      )}
    </div>
  );
};

export default Dashboard;
