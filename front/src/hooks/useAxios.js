import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Toast } from "../utils/sweetalert";

export const useAxios = () => {
  const { authenticatedUser, refreshToken, logout } = useAuth();

  const token = localStorage.getItem("token");
  const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers:
      token && authenticatedUser ? { Authorization: `Bearer ${token}` } : {},
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response &&
        error.response.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        try {
          await refreshToken();
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${localStorage.getItem("token")}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed, logging out...");
          // Error notification
          Toast.fire({
            icon: "error",
            title: "Token refresh failed, logging out...",
          });
          logout(); // Clear session and redirect to login
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};
