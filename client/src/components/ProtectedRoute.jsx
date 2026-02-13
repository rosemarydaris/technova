// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // check token

  if (!token) {
    return <Navigate to="/login" />; // redirect to login if no token
  }

  return children;
};

export default ProtectedRoute;
