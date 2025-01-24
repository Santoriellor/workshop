import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Reports.css";

function Reports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Fetch reports from the backend
    axios
      .get("http://localhost:8000/api/reports/")
      .then((response) => setReports(response.data))
      .catch((error) => console.error("Error fetching reports:", error));
  }, []);

  return (
    <div className="reports">
      <h2>Reports</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.title}</td>
              <td>{report.description}</td>
              <td>{report.status}</td>
              <td>
                <button
                  onClick={() =>
                    window.open(
                      `http://localhost:8000/api/export-report/${report.id}/`
                    )
                  }
                >
                  Export
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;
