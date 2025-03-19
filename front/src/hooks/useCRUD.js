import { useState, useCallback } from "react";
import { useAxios } from "./useAxios";
// Contexts
import { useAuth } from "../contexts/AuthContext";

const useCRUD = (apiEndpoint, parentResource = null, itemId = null) => {
  const { authenticatedUser } = useAuth();

  const axiosInstance = useAxios();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    next: null,
    previous: null,
    count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Construct URL dynamically
  const baseURL =
    parentResource && itemId
      ? `${parentResource}/${itemId}/${apiEndpoint}/`
      : `${apiEndpoint}/`;

  // Centralized error handling
  const handleError = useCallback(
    (err) => {
      console.error(
        `Error in ${apiEndpoint}:`,
        err.message,
        err.response?.data || ""
      );
      setError(err.message || "An error occurred");
    },
    [apiEndpoint]
  );

  // Fetch all items
  const fetchData = useCallback(
    async (filters = {}, sort = "", limit = null, offset = null) => {
      if (!authenticatedUser) return;

      if (parentResource && !itemId) {
        setData([]); // Clear state when no itemId is selected
        return;
      }
      try {
        setLoading(true);

        // Build query params
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        if (sort) params.append("ordering", sort);
        if (limit !== null) params.append("limit", limit);
        if (offset !== null) params.append("offset", offset);

        const response = await axiosInstance.get(
          `${baseURL}?${params.toString()}`
        );

        if ("results" in response.data) {
          // ✅ If paginated response, extract metadata and results
          setData(response.data.results);
          setPagination({
            next: response.data.next,
            previous: response.data.previous,
            count: response.data.count,
          });
        } else {
          // ✅ If non-paginated response, store all data normally
          setData(response.data);
          setPagination({
            next: null,
            previous: null,
            count: response.data.length,
          });
        }

        return response.data;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [
      authenticatedUser,
      baseURL,
      itemId,
      parentResource,
      axiosInstance,
      handleError,
    ]
  );

  // Create an item
  const createItem = useCallback(
    async (itemData) => {
      if (!authenticatedUser) return;
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
    },
    [authenticatedUser, apiEndpoint, axiosInstance, handleError]
  );

  // Update an item
  const updateItem = useCallback(
    async (itemId, updatedFields) => {
      if (!authenticatedUser) return;
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
    },
    [authenticatedUser, apiEndpoint, axiosInstance, handleError]
  );

  // Delete an item
  const deleteItem = useCallback(
    async (itemId) => {
      if (!authenticatedUser) return;
      try {
        setLoading(true);
        const response = await axiosInstance.delete(
          `${apiEndpoint}/${itemId}/`
        );
        setData((prev) => prev.filter((item) => item.id !== itemId));
        return response;
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [authenticatedUser, apiEndpoint, axiosInstance, handleError]
  );

  return {
    data,
    setData,
    fetchData,
    pagination,
    createItem,
    updateItem,
    deleteItem,
    loading,
    error,
  };
};

export default useCRUD;
