import React, { createContext, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Hooks
import useCRUD from "../hooks/useCRUD";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const location = useLocation();
  const {
    data: users,
    fetchData: fetchUsers,
    loading: loadingUsers,
    error: errorUsers,
  } = useCRUD("users");

  // Function to get username by ID
  const getUserNameById = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? user.username : "Unknown";
  };

  // Automatically fetch data when pathname changes
  useEffect(() => {
    const userPaths = ["/user", "/report", "/dashboard", "/invoices"];
    if (userPaths.includes(location.pathname)) {
      fetchUsers();
    }
  }, [location.pathname]);

  return (
    <UserContext.Provider
      value={{
        users,
        getUserNameById,
        loadingUsers,
        errorUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUserContext = () => useContext(UserContext);
