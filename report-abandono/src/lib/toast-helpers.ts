import { toast } from "sonner"

/**
 * Exibe toast de erro para e-mail inválido
 */
export function showInvalidEmailToast() {
  toast.error("E-mail inválido", {
    description: "Por favor, insira um e-mail válido no formato exemplo@email.com",
  })
}

/**
 * Exibe toast de erro para e-mail não cadastrado
 * @param onRegisterClick - Callback para quando o usuário clicar em "Criar conta"
 */
export function showEmailNotFoundToast(onRegisterClick?: () => void) {
  toast.error("E-mail não cadastrado", {
    description: "Este e-mail não está cadastrado no sistema. Deseja criar uma conta?",
    action: onRegisterClick
      ? {
          label: "Criar conta",
          onClick: onRegisterClick,
        }
      : undefined,
  })
}

/**
 * Exibe toast de erro para credenciais inválidas (e-mail ou senha incorretos)
 */
export function showInvalidCredentialsToast() {
  toast.error("Credenciais inválidas", {
    description: "O e-mail ou senha informados estão incorretos. Por favor, verifique e tente novamente.",
  })
}

/**
 * Exibe toast de erro genérico
 * @param message - Mensagem de erro
 * @param description - Descrição detalhada do erro
 */
export function showErrorToast(message: string, description?: string) {
  toast.error(message, {
    description,
  })
}

/**
 * Exibe toast de erro para e-mail não cadastrado (página de esqueceu a senha)
 */
export function showEmailNotFoundForgotPasswordToast() {
  toast.error("E-mail não cadastrado", {
    description: "Este e-mail não está cadastrado no sistema.",
  })
}

/**
 * Exibe toast de sucesso
 * @param message - Mensagem de sucesso
 * @param description - Descrição detalhada
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description,
  })
}



