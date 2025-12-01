import { Routes, Route } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Documents from "./pages/Documents";
import Partners from "./pages/Partners";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Companies from "./pages/Companies";
import User from "./pages/User";
import { CompanyProvider } from "./components/CompanyContext";
import { AuthProvider } from "./components/AuthContext";

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
        </Routes>
        <ToastContainer />
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
