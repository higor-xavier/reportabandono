import { Toaster } from "sonner"
import { LoginPage } from "./components/LoginPage"

export function App() {
  return (
    <>
      <LoginPage />
      <Toaster position="top-center" richColors />
    </>
  )
}
