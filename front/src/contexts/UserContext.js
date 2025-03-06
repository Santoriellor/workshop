import React, { createContext, useContext, useEffect } from "react";
// Hooks
import useCRUD from "../hooks/useCRUD";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
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

  // Automatically fetch data on first load
  useEffect(() => {
    fetchUsers();
  }, []);

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
