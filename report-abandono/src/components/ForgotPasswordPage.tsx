import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Header } from "./Header"
import { PetIllustration } from "./PetIllustration"
import { showInvalidEmailToast, showErrorToast, showSuccessToast, showEmailNotFoundForgotPasswordToast } from "@/lib/toast-helpers"

// Função para validar formato de e-mail
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")

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

    // Simulação de chamada à API
    // TODO: Substituir por chamada real quando o backend estiver pronto
    try {
      // const response = await fetch('/api/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // })
      
      // if (!response.ok) {
      //   const error = await response.json()
      //   
      //   // E-mail não cadastrado
      //   if (error.code === 'USER_NOT_FOUND' || error.message?.includes('não encontrado')) {
      //     showEmailNotFoundForgotPasswordToast()
      //     return
      //   }
      
      //   // Erro genérico
      //   showErrorToast("Erro ao enviar token", error.message || "Ocorreu um erro inesperado. Por favor, tente novamente.")
      //   return
      // }
      
      // const data = await response.json()
      // // Toast de sucesso só aparece quando o servidor confirmar
      // showSuccessToast("Token enviado", "Um token foi enviado para o e-mail informado para realizar o login e a troca de senha.")
      
    } catch (error) {
      showErrorToast(
        "Erro ao enviar token",
        "Ocorreu um erro inesperado. Por favor, tente novamente."
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Section - Illustration */}
        <div className="hidden lg:flex flex-1 bg-white items-center justify-center p-6 md:p-12">
          <PetIllustration />
        </div>

        {/* Right Section - Forgot Password Form */}
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-md w-full max-w-md p-4 sm:p-6 md:p-8 my-auto relative">
            {/* Back Button */}
            <Link
              to="/"
              className="absolute top-4 left-4 sm:top-6 sm:left-6 text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="Voltar para login"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>

            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 text-center mb-4 sm:mb-6">
              Esqueceu a senha
            </h2>

            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-1 sm:space-y-2">
                <label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
                  Digite o e-mail da sua conta:
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

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full font-semibold py-2 h-10 sm:h-11"
              >
                TROCAR A SENHA
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

