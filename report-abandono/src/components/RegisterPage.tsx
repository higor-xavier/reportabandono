import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Header } from "./Header"
import { PetIllustration } from "./PetIllustration"
import { ToggleGroup } from "./ui/toggle-group"
import { showInvalidEmailToast, showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

type UserType = "common" | "ong"

// Função para validar formato de e-mail
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para validar CPF
function isValidCPF(cpf: string): boolean {
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
  return cpfRegex.test(cpf)
}

// Função para validar CNPJ
function isValidCNPJ(cnpj: string): boolean {
  const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
  return cnpjRegex.test(cnpj)
}

// Função para formatar telefone
function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim()
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim()
}

// Função para formatar CPF
function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "")
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

// Função para formatar CNPJ
function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, "")
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [userType, setUserType] = useState<UserType>("common")
  const [isAnimating, setIsAnimating] = useState(false)

  // Formulário Comum
  const [commonForm, setCommonForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    cpf: "",
    address: "",
  })

  // Formulário ONG
  const [ongForm, setOngForm] = useState({
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    cnpj: "",
    address: "",
  })

  const handleUserTypeChange = (newType: string) => {
    if (newType === userType) return
    
    setIsAnimating(true)
    setTimeout(() => {
      setUserType(newType as UserType)
      setTimeout(() => {
        setIsAnimating(false)
      }, 50)
    }, 200)
  }

  const handleCommonFormChange = (field: string, value: string) => {
    let formattedValue = value
    
    if (field === "phone") {
      formattedValue = formatPhone(value)
    } else if (field === "cpf") {
      formattedValue = formatCPF(value)
    }
    
    setCommonForm((prev) => ({ ...prev, [field]: formattedValue }))
  }

  const handleOngFormChange = (field: string, value: string) => {
    let formattedValue = value
    
    if (field === "phone") {
      formattedValue = formatPhone(value)
    } else if (field === "cnpj") {
      formattedValue = formatCNPJ(value)
    }
    
    setOngForm((prev) => ({ ...prev, [field]: formattedValue }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (userType === "common") {
        // Validações do formulário comum
        if (!commonForm.fullName) {
          showErrorToast("Campo obrigatório", "Por favor, preencha o nome completo")
          return
        }

        if (!commonForm.email || !isValidEmail(commonForm.email)) {
          showInvalidEmailToast()
          return
        }

        if (!commonForm.password || commonForm.password.length < 6) {
          showErrorToast("Senha inválida", "A senha deve ter no mínimo 6 caracteres")
          return
        }

        if (commonForm.password !== commonForm.confirmPassword) {
          showErrorToast("Senhas não coincidem", "As senhas informadas não são iguais")
          return
        }

        if (!commonForm.cpf || !isValidCPF(commonForm.cpf)) {
          showErrorToast("CPF inválido", "Por favor, insira um CPF válido no formato 000.000.000-00")
          return
        }

        // Chamada à API
        const response = await fetch("http://localhost:3333/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userType: "COMUM",
            fullName: commonForm.fullName,
            email: commonForm.email,
            password: commonForm.password,
            phone: commonForm.phone || undefined,
            cpf: commonForm.cpf,
            address: commonForm.address || undefined,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          // E-mail duplicado (409)
          if (response.status === 409) {
            showErrorToast("E-mail já cadastrado", "Este e-mail já está em uso. Por favor, use outro e-mail ou faça login.")
            return
          }

          // Erro de validação (400)
          if (response.status === 400) {
            showErrorToast("Dados inválidos", data.message || "Por favor, verifique os dados informados")
            return
          }

          // Erro genérico
          showErrorToast("Erro ao cadastrar", data.message || "Ocorreu um erro ao processar o cadastro")
          return
        }

        // Sucesso - redirecionar para login
        showSuccessToast("Cadastro realizado com sucesso!", "Você pode fazer login agora")
        setTimeout(() => {
          navigate("/")
        }, 1500)
      } else {
        // Validações do formulário ONG
        if (!ongForm.organizationName) {
          showErrorToast("Campo obrigatório", "Por favor, preencha o nome da organização")
          return
        }

        if (!ongForm.email || !isValidEmail(ongForm.email)) {
          showInvalidEmailToast()
          return
        }

        if (!ongForm.password || ongForm.password.length < 6) {
          showErrorToast("Senha inválida", "A senha deve ter no mínimo 6 caracteres")
          return
        }

        if (ongForm.password !== ongForm.confirmPassword) {
          showErrorToast("Senhas não coincidem", "As senhas informadas não são iguais")
          return
        }

        if (!ongForm.cnpj || !isValidCNPJ(ongForm.cnpj)) {
          showErrorToast("CNPJ inválido", "Por favor, insira um CNPJ válido no formato 00.000.000/0000-00")
          return
        }

        // Chamada à API
        const response = await fetch("http://localhost:3333/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userType: "ONG",
            organizationName: ongForm.organizationName,
            email: ongForm.email,
            password: ongForm.password,
            phone: ongForm.phone || undefined,
            cnpj: ongForm.cnpj,
            address: ongForm.address || undefined,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          // E-mail duplicado (409)
          if (response.status === 409) {
            showErrorToast("E-mail já cadastrado", "Este e-mail já está em uso. Por favor, use outro e-mail ou faça login.")
            return
          }

          // Erro de validação (400)
          if (response.status === 400) {
            showErrorToast("Dados inválidos", data.message || "Por favor, verifique os dados informados")
            return
          }

          // Erro genérico
          showErrorToast("Erro ao cadastrar", data.message || "Ocorreu um erro ao processar o cadastro")
          return
        }

        // Sucesso ONG - mostrar mensagem e redirecionar com delay
        showSuccessToast(
          "Solicitação enviada!",
          "Aguarde a aprovação do administrador para acessar o sistema."
        )
        setTimeout(() => {
          navigate("/")
        }, 4000)
      }
    } catch (error) {
      // Erro de conexão ou erro inesperado
      showErrorToast(
        "Erro de conexão",
        "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
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

        {/* Right Section - Registration Form */}
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
            
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 text-center mb-3 sm:mb-4">Cadastro</h2>

            {/* Toggle Group */}
            <div className="mb-4 sm:mb-6 flex justify-center">
              <ToggleGroup
                value={userType}
                onValueChange={handleUserTypeChange}
                options={[
                  { value: "common", label: "Comum" },
                  { value: "ong", label: "ONG" },
                ]}
                className="w-auto"
              />
            </div>

            {/* Form Container with Animation */}
            <div className="relative overflow-hidden">
              <form
                onSubmit={handleSubmit}
                className={`space-y-2 sm:space-y-3 transition-all duration-300 ease-in-out ${
                  isAnimating 
                    ? "opacity-0 translate-x-4 pointer-events-none" 
                    : "opacity-100 translate-x-0 pointer-events-auto"
                }`}
              >
                {userType === "common" ? (
                  <>
                    {/* Nome completo */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="fullName" className="text-xs sm:text-sm font-medium text-gray-700">
                        Nome completo:
                      </label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="João Miguel dos Anjos"
                        value={commonForm.fullName}
                        onChange={(e) => handleCommonFormChange("fullName", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                      />
                    </div>

                    {/* E-mail */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="commonEmail" className="text-xs sm:text-sm font-medium text-gray-700">
                        E-mail:
                      </label>
                      <Input
                        id="commonEmail"
                        type="email"
                        placeholder="example@email.com"
                        value={commonForm.email}
                        onChange={(e) => handleCommonFormChange("email", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                      />
                    </div>

                    {/* Senha */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="commonPassword" className="text-xs sm:text-sm font-medium text-gray-700">
                        Senha:
                      </label>
                      <Input
                        id="commonPassword"
                        type="password"
                        placeholder="**********"
                        value={commonForm.password}
                        onChange={(e) => handleCommonFormChange("password", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                      />
                    </div>

                    {/* Confirmar senha */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="commonConfirmPassword" className="text-xs sm:text-sm font-medium text-gray-700">
                        Confirmar senha:
                      </label>
                      <Input
                        id="commonConfirmPassword"
                        type="password"
                        placeholder="**********"
                        value={commonForm.confirmPassword}
                        onChange={(e) => handleCommonFormChange("confirmPassword", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                      />
                    </div>

                    {/* Telefone */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="commonPhone" className="text-xs sm:text-sm font-medium text-gray-700">
                        Número de contato:
                      </label>
                      <Input
                        id="commonPhone"
                        type="tel"
                        placeholder="(33) 9 0000-0000"
                        value={commonForm.phone}
                        onChange={(e) => handleCommonFormChange("phone", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                        maxLength={15}
                      />
                    </div>

                    {/* CPF */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="cpf" className="text-xs sm:text-sm font-medium text-gray-700">
                        CPF:
                      </label>
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={commonForm.cpf}
                        onChange={(e) => handleCommonFormChange("cpf", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                        maxLength={14}
                      />
                    </div>

                    {/* Endereço */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="commonAddress" className="text-xs sm:text-sm font-medium text-gray-700">
                        Endereço residencial:
                      </label>
                      <Input
                        id="commonAddress"
                        type="text"
                        placeholder="Rua/Avenida, número, bairro"
                        value={commonForm.address}
                        onChange={(e) => handleCommonFormChange("address", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Nome da organização */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="organizationName" className="text-xs sm:text-sm font-medium text-gray-700">
                        Nome da organização:
                      </label>
                      <Input
                        id="organizationName"
                        type="text"
                        placeholder="Digite o nome completo da organização"
                        value={ongForm.organizationName}
                        onChange={(e) => handleOngFormChange("organizationName", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                      />
                    </div>

                    {/* E-mail */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="ongEmail" className="text-xs sm:text-sm font-medium text-gray-700">
                        E-mail:
                      </label>
                      <Input
                        id="ongEmail"
                        type="email"
                        placeholder="example@email.com"
                        value={ongForm.email}
                        onChange={(e) => handleOngFormChange("email", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                      />
                    </div>

                    {/* Senha */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="ongPassword" className="text-xs sm:text-sm font-medium text-gray-700">
                        Senha:
                      </label>
                      <Input
                        id="ongPassword"
                        type="password"
                        placeholder="**********"
                        value={ongForm.password}
                        onChange={(e) => handleOngFormChange("password", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                      />
                    </div>

                    {/* Confirmar senha */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="ongConfirmPassword" className="text-xs sm:text-sm font-medium text-gray-700">
                        Confirmar senha:
                      </label>
                      <Input
                        id="ongConfirmPassword"
                        type="password"
                        placeholder="**********"
                        value={ongForm.confirmPassword}
                        onChange={(e) => handleOngFormChange("confirmPassword", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                      />
                    </div>

                    {/* Telefone */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="ongPhone" className="text-xs sm:text-sm font-medium text-gray-700">
                        Número de contato:
                      </label>
                      <Input
                        id="ongPhone"
                        type="tel"
                        placeholder="(33) 9 0000-0000"
                        value={ongForm.phone}
                        onChange={(e) => handleOngFormChange("phone", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                        maxLength={15}
                      />
                    </div>

                    {/* CNPJ */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="cnpj" className="text-xs sm:text-sm font-medium text-gray-700">
                        CNPJ:
                      </label>
                      <Input
                        id="cnpj"
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={ongForm.cnpj}
                        onChange={(e) => handleOngFormChange("cnpj", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                        maxLength={18}
                      />
                    </div>

                    {/* Endereço */}
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="ongAddress" className="text-xs sm:text-sm font-medium text-gray-700">
                        Endereço da organização:
                      </label>
                      <Input
                        id="ongAddress"
                        type="text"
                        placeholder="Rua/Avenida, número, bairro"
                        value={ongForm.address}
                        onChange={(e) => handleOngFormChange("address", e.target.value)}
                        className="w-full bg-gray-100 border-gray-300"
                      />
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-semibold py-2 h-10 sm:h-11 mt-4 sm:mt-6"
                >
                  CADASTRAR-SE
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

