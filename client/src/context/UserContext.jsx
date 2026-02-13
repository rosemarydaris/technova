// src/context/UserContext.js
import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize from localStorage
    return {
      name: localStorage.getItem("userName") || "",
      domain: localStorage.getItem("userDomain") || "",
      email: localStorage.getItem("userEmail") || "",
      token: localStorage.getItem("token") || "",
    };
  });

  // Persist to localStorage whenever user state changes
  useEffect(() => {
    if (user.token) {
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userDomain", user.domain);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("token", user.token);
    } else {
      // Clear localStorage if user is logged out
      localStorage.removeItem("userName");
      localStorage.removeItem("userDomain");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("token");
    }
  }, [user]);

  // Logout function to clear user data
  const logout = () => {
    setUser({
      name: "",
      domain: "",
      email: "",
      token: "",
    });
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};