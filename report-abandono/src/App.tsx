import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { AuthProvider } from "./contexts/AuthContext"
import { LoginPage } from "./components/LoginPage"
import { RegisterPage } from "./components/RegisterPage"
import { ForgotPasswordPage } from "./components/ForgotPasswordPage"
import { HomePage } from "./components/HomePage"
import { RegisterReportPage } from "./components/RegisterReportPage"
import { ComplaintsListPage } from "./components/ComplaintsListPage"
import { ComplaintsManagementPage } from "./components/ComplaintsManagementPage"
import { RequestsManagementPage } from "./components/RequestsManagementPage"
import { TrackingPage } from "./components/TrackingPage"
import { NotFoundPage } from "./components/NotFoundPage"
import { ProtectedRoute } from "./components/ProtectedRoute"

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Rotas protegidas - requerem autenticação */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrardenuncia"
            element={
              <ProtectedRoute>
                <RegisterReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rastreio"
            element={
              <ProtectedRoute>
                <TrackingPage />
              </ProtectedRoute>
            }
          />

          {/* Rotas protegidas por tipo de usuário */}
          <Route
            path="/denuncias"
            element={
              <ProtectedRoute requiredUserType="COMUM">
                <ComplaintsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gerenciamento-denuncias"
            element={
              <ProtectedRoute requiredUserType="ONG">
                <ComplaintsManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gerenciamento-solicitacoes"
            element={
              <ProtectedRoute requiredUserType="ADMIN">
                <RequestsManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Rota catch-all para 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </BrowserRouter>
  )
}
