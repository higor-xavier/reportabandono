import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { LoginPage } from "./components/LoginPage"
import { RegisterPage } from "./components/RegisterPage"
import { ForgotPasswordPage } from "./components/ForgotPasswordPage"
import { HomePage } from "./components/HomePage"
import { RegisterReportPage } from "./components/RegisterReportPage"
import { ComplaintsListPage } from "./components/ComplaintsListPage"
import { NotFoundPage } from "./components/NotFoundPage"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/registrardenuncia" element={<RegisterReportPage />} />
        <Route path="/denuncias" element={<ComplaintsListPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  )
}
