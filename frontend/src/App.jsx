import { Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import FinancialDocs from "./pages/FinancialDocs";
import Partners from "./pages/Partners";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Companies from "./pages/Companies";
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
            path="/documents"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FinancialDocs />
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
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
