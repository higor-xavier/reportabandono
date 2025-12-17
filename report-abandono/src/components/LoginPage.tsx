import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Header } from "./Header"
import { PetIllustration } from "./PetIllustration"
import {
  showInvalidEmailToast,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showEmailNotFoundToast, // Pronto para uso quando API retornar USER_NOT_FOUND
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showInvalidCredentialsToast, // Pronto para uso quando API retornar INVALID_CREDENTIALS
  showErrorToast,
} from "@/lib/toast-helpers"

// Função para validar formato de e-mail
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
      toast.error("Campo obrigatório", {
        description: "Por favor, preencha o campo de e-mail",
      })
      return
    }

    if (!isValidEmail(email)) {
      setEmailError("E-mail inválido")
      showInvalidEmailToast()
      return
    }

    if (!password) {
      toast.error("Campo obrigatório", {
        description: "Por favor, preencha o campo de senha",
      })
      return
    }

    // Simulação de chamada à API
    // TODO: Substituir por chamada real quando o backend estiver pronto
    try {
      // const response = await fetch('/api/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // })
      
      // if (!response.ok) {
      //   const error = await response.json()
      //   
      //   // E-mail não cadastrado
      //   if (error.code === 'USER_NOT_FOUND' || error.message?.includes('não encontrado')) {
      //     showEmailNotFoundToast(() => {
      //       // Navegar para página de registro
      //       // navigate('/register')
      //     })
      //     return
      //   }
      
      //   // E-mail ou senha inválidos
      //   if (error.code === 'INVALID_CREDENTIALS' || error.message?.includes('inválido')) {
      //     showInvalidCredentialsToast()
      //     return
      //   }
      
      //   // Erro genérico
      //   showErrorToast("Erro ao fazer login", error.message || "Ocorreu um erro inesperado")
      //   return
      // }
      
      // const data = await response.json()
      // toast.success("Login realizado com sucesso!", {
      //   description: "Redirecionando...",
      // })
      // // Redirecionar para dashboard ou página principal
      // // navigate('/dashboard')
      
    } catch (error) {
      showErrorToast(
        "Erro ao fazer login",
        "Ocorreu um erro inesperado. Por favor, tente novamente."
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Section - Illustration */}
        <div className="flex-1 bg-white flex items-center justify-center p-6 md:p-12 min-h-[300px] lg:min-h-0">
          <PetIllustration />
        </div>

        {/* Right Section - Login Form */}
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 md:p-12">
          <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">Entrar</h2>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
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
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
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
                className="w-full font-semibold py-2 h-11"
              >
                LOGAR
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
                >
                  Esqueceu a senha?
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

