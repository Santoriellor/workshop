import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const getReports = async () => {
  return await axios.get(`${API_URL}/reports/`);
};

export const createReport = async (data) => {
  return await axios.post(`${API_URL}/reports/`, data);
};
