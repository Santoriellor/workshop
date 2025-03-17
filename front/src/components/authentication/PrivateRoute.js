import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const PrivateRoute = () => {
  const { authenticatedUser, loadingAuth } = useAuth();

  if (loadingAuth) {
    // Show a loading spinner, skeleton screen, or nothing while auth is being determined
    return <p>Loading...</p>; // Replace with a better UI component if needed
  }

  return authenticatedUser ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
