import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
  requiredUserType?: "ADMIN" | "ONG" | "COMUM"
}

/**
 * Componente que protege rotas exigindo autenticação
 * Opcionalmente, pode exigir um tipo específico de usuário
 */
export function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Se exigir um tipo específico de usuário, verificar
  if (requiredUserType && user?.tipoUsuario !== requiredUserType) {
    // Redirecionar para home se não tiver permissão
    return <Navigate to="/home" replace />
  }

  // Usuário autenticado e com permissão (se necessário)
  return <>{children}</>
}
