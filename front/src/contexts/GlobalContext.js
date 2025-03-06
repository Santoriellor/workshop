import React, { createContext, useContext, useState } from "react";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [selectedItem, setSelectedItem] = useState({});

  return (
    <GlobalContext.Provider value={{ selectedItem, setSelectedItem }}>
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook to use the GlobalContext
export const useGlobalContext = () => useContext(GlobalContext);
