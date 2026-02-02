import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import { Trash2, AlertTriangle } from "lucide-react"

// Função para formatar telefone
function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
}

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, token, signOut, updateUser } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    nomeCompleto: "",
    numeroContato: "",
    endereco: "",
  })

  // Carregar dados do usuário quando o dialog abrir
  useEffect(() => {
    if (open && user) {
      setFormData({
        nomeCompleto: user.nomeCompleto || "",
        numeroContato: user.numeroContato || "",
        endereco: user.endereco || "",
      })
      setShowDeleteConfirm(false)
    }
  }, [open, user])

  // Buscar dados atualizados do servidor
  useEffect(() => {
    if (open && token) {
      const fetchUserData = async () => {
        try {
          const response = await fetch("http://localhost:3333/users/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.user) {
              setFormData({
                nomeCompleto: data.user.nomeCompleto || "",
                numeroContato: data.user.numeroContato || "",
                endereco: data.user.endereco || "",
              })
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error)
        }
      }

      fetchUserData()
    }
  }, [open, token])

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === "numeroContato") {
      formattedValue = formatPhone(value)
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      showErrorToast("Erro de autenticação", "Você precisa estar logado para atualizar o perfil.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:3333/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nomeCompleto: formData.nomeCompleto.trim() || null,
          numeroContato: formData.numeroContato.trim() || null,
          endereco: formData.endereco.trim() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao atualizar perfil")
      }

      const data = await response.json()
      showSuccessToast("Perfil atualizado", "Seus dados foram atualizados com sucesso!")

      // Atualizar dados no contexto
      if (data.user) {
        updateUser(data.user)
      }

      onOpenChange(false)
    } catch (error: any) {
      showErrorToast("Erro ao atualizar perfil", error.message || "Não foi possível atualizar o perfil.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!token) {
      showErrorToast("Erro de autenticação", "Você precisa estar logado para excluir a conta.")
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch("http://localhost:3333/users/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao excluir conta")
      }

      const data = await response.json()
      showSuccessToast("Conta excluída", data.message || "Sua conta foi processada com sucesso.")

      // Deslogar e redirecionar
      setTimeout(() => {
        signOut()
        navigate("/")
      }, 1500)
    } catch (error: any) {
      showErrorToast("Erro ao excluir conta", error.message || "Não foi possível excluir a conta.")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>Atualize suas informações pessoais</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (somente leitura) */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">O e-mail não pode ser alterado</p>
          </div>

          {/* Nome Completo */}
          <div className="space-y-2">
            <label htmlFor="nomeCompleto" className="text-sm font-medium text-gray-700">
              Nome Completo
            </label>
            <Input
              id="nomeCompleto"
              type="text"
              placeholder="Seu nome completo"
              value={formData.nomeCompleto}
              onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <label htmlFor="numeroContato" className="text-sm font-medium text-gray-700">
              Telefone
            </label>
            <Input
              id="numeroContato"
              type="text"
              placeholder="(00) 00000-0000"
              value={formData.numeroContato}
              onChange={(e) => handleInputChange("numeroContato", e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <label htmlFor="endereco" className="text-sm font-medium text-gray-700">
              Endereço
            </label>
            <Input
              id="endereco"
              type="text"
              placeholder="Seu endereço completo"
              value={formData.endereco}
              onChange={(e) => handleInputChange("endereco", e.target.value)}
              className="bg-white"
            />
          </div>

          {/* CPF/CNPJ (somente leitura) */}
          {(user.cpf || user.cnpj) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {user.cpf ? "CPF" : "CNPJ"}
              </label>
              <Input
                type="text"
                value={user.cpf || user.cnpj || ""}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Este campo não pode ser alterado</p>
            </div>
          )}

          {/* Zona de Perigo - Apagar Conta */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Zona de Perigo</h3>
                  <p className="text-xs text-red-700 mb-4">
                    Ao excluir sua conta, você perderá acesso permanente. Se você tiver denúncias
                    registradas, seus dados serão mantidos anonimizados apenas para histórico. Se não
                    tiver, tudo será apagado permanentemente.
                  </p>
                  {!showDeleteConfirm ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Apagar Conta
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white border border-red-300 rounded p-3">
                        <p className="text-sm text-red-900 font-medium mb-2">
                          Tem certeza que deseja apagar sua conta?
                        </p>
                        <p className="text-xs text-red-700">
                          Se você tiver denúncias registradas, seus dados serão mantidos anonimizados
                          apenas para histórico. Se não tiver, tudo será apagado. Esta ação não pode ser
                          desfeita.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1"
                          disabled={isDeleting}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="flex-1"
                        >
                          {isDeleting ? "Excluindo..." : "Sim, apagar conta"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
