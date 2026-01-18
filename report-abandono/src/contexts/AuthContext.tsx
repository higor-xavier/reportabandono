import { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"

interface User {
  id: number
  nomeCompleto: string | null
  email: string
  tipoUsuario: string | null
  status: number
  cpf: string | null
  cnpj: string | null
  endereco: string | null
  numeroContato: string | null
  criadoEm: string | Date
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY_TOKEN = "@reportabandono:token"
const STORAGE_KEY_USER = "@reportabandono:user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar dados do localStorage ao inicializar
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
    const storedUser = localStorage.getItem(STORAGE_KEY_USER)

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Erro ao carregar dados do localStorage:", error)
        localStorage.removeItem(STORAGE_KEY_TOKEN)
        localStorage.removeItem(STORAGE_KEY_USER)
      }
    }

    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch("http://localhost:3333/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()

        // Cadastro em análise (ONG pendente/negada)
        if (error.error === "Cadastro em análise" || error.message?.includes("análise")) {
          throw new Error("CADASTRO_EM_ANALISE")
        }

        // Credenciais inválidas
        if (response.status === 401) {
          throw new Error("INVALID_CREDENTIALS")
        }

        // Erro genérico
        throw new Error(error.message || "Erro ao fazer login")
      }

      const data = await response.json()

      // Salvar token e usuário no localStorage
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token)
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user))

      // Atualizar estado
      setToken(data.token)
      setUser(data.user)
    } catch (error: any) {
      // Re-lançar o erro para ser tratado no componente
      throw error
    }
  }

  const signOut = () => {
    // Remover do localStorage
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_USER)

    // Limpar estado
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
