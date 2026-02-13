import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminTasks from "./pages/AdminTasks";
import Attendance from "./pages/Attendance";
import SalaryConfiguration from "./pages/SalaryConfiguration";
import PayrollProcessing from "./pages/PayrollProcessing";
import Reports from "./pages/Reports";
import NotificationManagement from "./pages/NotificationManagement";

// Employee Pages
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Tasks from "./pages/Tasks"; // Employee Tasks
import MyPayslips from "./pages/MyPayslips";
import EmployeeNotifications from "./pages/EmployeeNotifications";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Routes */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-tasks"
        element={
          <ProtectedRoute>
            <AdminTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/salary-configuration"
        element={
          <ProtectedRoute>
            <SalaryConfiguration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll-processing"
        element={
          <ProtectedRoute>
            <PayrollProcessing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications-management"
        element={
          <ProtectedRoute>
            <NotificationManagement />
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee-dashboard"
        element={
          <ProtectedRoute>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-payslips"
        element={
          <ProtectedRoute>
            <MyPayslips />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-notifications"
        element={
          <ProtectedRoute>
            <EmployeeNotifications />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
