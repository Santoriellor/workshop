import { useState } from "react";
import { useAxios } from "./useAxios";

const useCRUD = (apiEndpoint, parentResource = null, itemId = null) => {
  const axiosInstance = useAxios();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Construct URL dynamically
  const baseURL =
    parentResource && itemId
      ? `${parentResource}/${itemId}/${apiEndpoint}/`
      : `${apiEndpoint}/`;

  // Centralized error handling
  const handleError = (err) => {
    console.error(
      `Error in ${apiEndpoint}:`,
      err.message,
      err.response?.data || ""
    );
    setError(err.message || "An error occurred");
  };

  // Fetch all items
  const fetchData = async () => {
    if (parentResource && !itemId) {
      setData([]); // Clear state when no itemId is selected
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.get(baseURL);
      setData(response.data);
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Create an item
  const createItem = async (itemData) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`${apiEndpoint}/`, itemData);
      setData((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Update an item
  const updateItem = async (itemId, updatedFields) => {
    try {
      setLoading(true);
      const response = await axiosInstance.patch(
        `${apiEndpoint}/${itemId}/`,
        updatedFields
      );
      setData((prev) =>
        prev.map((item) => (item.id === itemId ? response.data : item))
      );
      return response.data;
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete an item
  const deleteItem = async (itemId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.delete(`${apiEndpoint}/${itemId}/`);
      setData((prev) => prev.filter((item) => item.id !== itemId));
      return response;
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    setData,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    loading,
    error,
  };
};

export default useCRUD;
