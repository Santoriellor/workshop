import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticatedUser, setAuthenticatedUser] = useState(() =>
    localStorage.getItem("token")
      ? JSON.parse(localStorage.getItem("authTokens")).access
      : null
  );
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  // Check for a token in localStorage on initial load
  useEffect(() => {
    const fetchUserData = async (token) => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/users/me/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAuthenticatedUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        logout(); // Log out if the token is invalid
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      fetchUserData(token);
      setLoadingAuth(false);
    } else {
      setLoadingAuth(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoadingAuth(true);
    try {
      const response = await axios.post("http://localhost:8000/api/login/", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);

      const fetchUserData = async (token) => {
        const userResponse = await axios.get(
          "http://localhost:8000/api/users/me/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAuthenticatedUser(userResponse.data);
      };
      await fetchUserData(response.data.access);
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "You have been logged in successfully!",
      });
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Invalid email or password. Please try again.",
      });
      return false;
    } finally {
      setLoadingAuth(false); // Stop loading
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setAuthenticatedUser(null);
    Swal.fire({
      icon: "success",
      title: "Logout Successful",
      text: "You have been logged out successfully!",
    });
    navigate("/login");
  };

  const register = async (username, email, password) => {
    setLoadingAuth(true);
    try {
      // Send registration data to the backend
      await axios.post("http://localhost:8000/api/register/", {
        username,
        email,
        password,
      });

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: "You have been registered successfully! Please log in.",
      });

      // Redirect to the login page
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text:
          error.response?.data?.error ||
          "An error occurred during registration. Please try again.",
      });
    } finally {
      setLoadingAuth(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await axios.post(
        "http://localhost:8000/api/token/refresh/",
        { refresh: refreshToken }
      );

      localStorage.setItem("token", response.data.access);
      if (response.data.refresh) {
        localStorage.setItem("refreshToken", response.data.refresh);
      }

      setAuthenticatedUser({ token: response.data.access });
      return response.data.access;
    } catch (error) {
      console.error("Token refresh failed:", error);

      if (error.response && error.response.status === 401) {
        console.error("Refresh token expired, logging out...");
        logout();
      }

      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authenticatedUser,
        login,
        logout,
        register,
        refreshToken,
        loadingAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
