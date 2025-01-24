import React from "react";
import { Link } from "react-router-dom";
import "../styles/Sidebar.css";

function Sidebar() {
  return (
    <nav className="sidebar">
      <ul>
        <li>
          <Link to="/">Overview</Link>
        </li>
        <li>
          <Link to="/reports">Manage Reports</Link>
        </li>
        <li>
          <Link to="/clients">Manage Clients</Link>
        </li>
        <li>
          <Link to="/bills">Manage Bills</Link>
        </li>
        {/* Add more links for other sections like Manage Bills, Users, etc. */}
      </ul>
    </nav>
  );
}

export default Sidebar;
