import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Clients.css";

function Clients() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    // Fetch clients from the backend
    axios
      .get("http://localhost:8000/api/clients/")
      .then((response) => setClients(response.data))
      .catch((error) => console.error("Error fetching clients:", error));
  }, []);

  return (
    <div className="clients">
      <h2>Clients</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            {/* Add more client info as needed */}
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td>{client.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Clients;
