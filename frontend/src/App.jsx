import { Routes, Route, Navigate } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Documents from "./pages/Documents";
import Partners from "./pages/Partners";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import Companies from "./pages/Companies";
import User from "./pages/User";
import { CompanyProvider } from "./components/CompanyContext";
import { AuthProvider } from "./components/AuthContext";
import { LoadingProvider } from "./components/LoadingContext";

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <CompanyProvider>
          <Routes>
            {/* Publiski pieejamie maršruti */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />

            {/* Aizsargātie maršruti */}
            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <Companies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user"
              element={
                <ProtectedRoute>
                  <User />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Documents />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/partners"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Partners />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ChartOfAccounts />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Noklusējuma maršruti */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Navigate to="/companies" replace />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <ToastContainer />
        </CompanyProvider>
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;
