import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Header } from "./Header"
import { PetIllustration } from "./PetIllustration"
import {
  showInvalidEmailToast,
  showInvalidCredentialsToast,
  showErrorToast,
  showRegistrationPendingToast,
} from "@/lib/toast-helpers"
import { useAuth } from "@/contexts/AuthContext"

// Função para validar formato de e-mail
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    
    // Limpa erro quando o usuário começa a digitar
    if (emailError) {
      setEmailError("")
    }
  }

  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setEmailError("E-mail inválido")
      showInvalidEmailToast()
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validação de e-mail
    if (!email) {
      showErrorToast("Campo obrigatório", "Por favor, preencha o campo de e-mail")
      return
    }

    if (!isValidEmail(email)) {
      setEmailError("E-mail inválido")
      showInvalidEmailToast()
      return
    }

    if (!password) {
      showErrorToast("Campo obrigatório", "Por favor, preencha o campo de senha")
      return
    }

    setIsLoading(true)

    try {
      await signIn(email, password)
      
      // Login bem-sucedido - redirecionar para /home
      navigate("/home")
    } catch (error: any) {
      // Tratar diferentes tipos de erro
      if (error.message === "CADASTRO_EM_ANALISE") {
        showRegistrationPendingToast()
      } else if (error.message === "INVALID_CREDENTIALS") {
        showInvalidCredentialsToast()
      } else {
        showErrorToast(
          "Erro ao fazer login",
          error.message || "Ocorreu um erro inesperado. Por favor, tente novamente."
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Section - Illustration */}
        <div className="hidden lg:flex flex-1 bg-white items-center justify-center p-6 md:p-12">
          <PetIllustration />
        </div>

        {/* Right Section - Login Form */}
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-md w-full max-w-md p-4 sm:p-6 md:p-8 my-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 text-center mb-6 sm:mb-8">Entrar</h2>
            
            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-1 sm:space-y-2">
                <label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
                  E-mail:
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className={`w-full bg-gray-100 border-gray-300 ${
                    emailError ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                  aria-invalid={emailError ? "true" : "false"}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
                {emailError && (
                  <p id="email-error" className="text-sm text-red-500">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1 sm:space-y-2">
                <label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700">
                  Senha:
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="**********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-100 border-gray-300"
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full font-semibold py-2 h-10 sm:h-11"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "LOGAR"}
              </Button>

              {/* Secondary Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                  asChild
                >
                  <Link to="/register">Registrar-se</Link>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                  asChild
                >
                  <Link to="/forgot-password">Esqueceu a senha?</Link>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

