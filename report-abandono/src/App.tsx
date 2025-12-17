import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { LoginPage } from "./components/LoginPage"
import { RegisterPage } from "./components/RegisterPage"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  )
}
