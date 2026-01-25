import { useState, useMemo, useEffect } from "react"
import { NavigationHeader } from "./NavigationHeader"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog"
import {
  Sun,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"
import { toast } from "sonner"

// Tipos para os dados
type RequestStatus = "nova" | "em_analise" | "negada" | "concluida"
type RequestType = "ONG_PENDENTE" | "USUARIO_REPORTADO" | "DENUNCIA_NEGADA"

interface Request {
  id: string
  tipo: RequestType
  protocolo: string
  dataInclusao: string
  status: RequestStatus
  dataRetorno: string | null
  feedback: string | null
  dados: any // Dados específicos de cada tipo
}

// Função para formatar status
const formatStatus = (status: RequestStatus): string => {
  const statusMap: Record<RequestStatus, string> = {
    nova: "Nova",
    em_analise: "Em análise",
    negada: "Negada",
    concluida: "Concluída",
  }
  return statusMap[status]
}

// Função para obter cor do status
const getStatusColor = (status: RequestStatus): string => {
  const colorMap: Record<RequestStatus, string> = {
    nova: "bg-gray-200",
    em_analise: "bg-gray-200",
    negada: "bg-gray-300",
    concluida: "bg-[#A4CEBD]",
  }
  return colorMap[status]
}

// Função para formatar data brasileira
const formatDateBR = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}

const API_BASE_URL = "http://localhost:3333"

export function RequestsManagementPage() {
  const { token } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [requests, setRequests] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reprovarMotivo, setReprovarMotivo] = useState("")
  const [isReprovarDialogOpen, setIsReprovarDialogOpen] = useState(false)
  const itemsPerPage = 5

  // Buscar solicitações da API
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/admin/solicitacoes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Erro ao buscar solicitações")
        }

        const data = await response.json()
        setRequests(data)
      } catch (error) {
        console.error("Erro ao buscar solicitações:", error)
        showErrorToast("Erro ao carregar solicitações", "Tente novamente mais tarde")
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchRequests()
    }
  }, [token])

  // Calcular contadores de status
  const statusCounts = useMemo(() => {
    return {
      nova: requests.filter((r) => r.status === "nova").length,
      em_analise: requests.filter((r) => r.status === "em_analise").length,
      negada: requests.filter((r) => r.status === "negada").length,
      concluida: requests.filter((r) => r.status === "concluida").length,
    }
  }, [requests])

  // Filtrar solicitações baseado na busca
  const filteredRequests = useMemo(() => {
    if (!searchTerm.trim()) {
      return requests
    }

    const term = searchTerm.toLowerCase()
    return requests.filter((request) => {
      return (
        request.protocolo.toLowerCase().includes(term) ||
        request.dataInclusao.includes(term) ||
        formatStatus(request.status).toLowerCase().includes(term) ||
        (request.dataRetorno && request.dataRetorno.includes(term))
      )
    })
  }, [requests, searchTerm])

  // Paginação
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex)

  // Handlers
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRowClick = (request: Request) => {
    setSelectedRequest(request)
    setIsDialogOpen(true)
  }

  // Ações para ONG Pendente
  const handleAprovarOng = async () => {
    if (!selectedRequest || selectedRequest.tipo !== "ONG_PENDENTE") return

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/ongs/${selectedRequest.dados.id}/aprovar`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao aprovar ONG")
      }

      showSuccessToast("ONG aprovada com sucesso", "Um e-mail foi enviado para a ONG")
      setIsDialogOpen(false)
      setSelectedRequest(null)

      // Recarregar solicitações
      const refreshResponse = await fetch(`${API_BASE_URL}/admin/solicitacoes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setRequests(data)
      }
    } catch (error: any) {
      showErrorToast("Erro ao aprovar ONG", error.message)
    }
  }

  const handleReprovarOng = async () => {
    if (!selectedRequest || selectedRequest.tipo !== "ONG_PENDENTE") return

    if (!reprovarMotivo.trim()) {
      toast.error("Motivo obrigatório", {
        description: "Por favor, informe o motivo da reprovação",
      })
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/ongs/${selectedRequest.dados.id}/reprovar`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ motivo: reprovarMotivo }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao reprovar ONG")
      }

      showSuccessToast("ONG reprovada com sucesso", "Um e-mail foi enviado para a ONG")
      setIsReprovarDialogOpen(false)
      setIsDialogOpen(false)
      setSelectedRequest(null)
      setReprovarMotivo("")

      // Recarregar solicitações
      const refreshResponse = await fetch(`${API_BASE_URL}/admin/solicitacoes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setRequests(data)
      }
    } catch (error: any) {
      showErrorToast("Erro ao reprovar ONG", error.message)
    }
  }

  // Ações para Usuário Reportado
  const handleConfirmarBanimento = async () => {
    if (!selectedRequest || selectedRequest.tipo !== "USUARIO_REPORTADO") return

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/usuarios/${selectedRequest.dados.id}/banir`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao confirmar banimento")
      }

      showSuccessToast("Banimento confirmado", "O usuário permanecerá banido")
      setIsDialogOpen(false)
      setSelectedRequest(null)

      // Recarregar solicitações
      const refreshResponse = await fetch(`${API_BASE_URL}/admin/solicitacoes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setRequests(data)
      }
    } catch (error: any) {
      showErrorToast("Erro ao confirmar banimento", error.message)
    }
  }

  const handleReverterStatus = async () => {
    if (!selectedRequest || selectedRequest.tipo !== "USUARIO_REPORTADO") return

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/usuarios/${selectedRequest.dados.id}/reverter`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao reverter status")
      }

      showSuccessToast("Status revertido", "O usuário voltou a ter acesso ao sistema")
      setIsDialogOpen(false)
      setSelectedRequest(null)

      // Recarregar solicitações
      const refreshResponse = await fetch(`${API_BASE_URL}/admin/solicitacoes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setRequests(data)
      }
    } catch (error: any) {
      showErrorToast("Erro ao reverter status", error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />

      <main className="flex-1 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Título */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-6 sm:mb-8 text-center">
            Gerenciamento de solicitações
          </h1>

          {/* Cards de Resumo de Status */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Novas */}
            <div className="bg-gray-200 rounded-lg p-4 sm:p-5 flex flex-col items-center gap-2">
              <Sun className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
              <h3 className="text-sm sm:text-base font-medium text-gray-800">Novas</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{statusCounts.nova}</p>
            </div>

            {/* Em análise */}
            <div className="bg-gray-200 rounded-lg p-4 sm:p-5 flex flex-col items-center gap-2">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
              <h3 className="text-sm sm:text-base font-medium text-gray-800">Em análise</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{statusCounts.em_analise}</p>
            </div>

            {/* Negadas */}
            <div className="bg-gray-300 rounded-lg p-4 sm:p-5 flex flex-col items-center gap-2">
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
              <h3 className="text-sm sm:text-base font-medium text-gray-800">Negadas</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{statusCounts.negada}</p>
            </div>

            {/* Concluídas */}
            <div className="bg-[#A4CEBD] rounded-lg p-4 sm:p-5 flex flex-col items-center gap-2">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
              <h3 className="text-sm sm:text-base font-medium text-gray-800">Concluídas</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{statusCounts.concluida}</p>
            </div>
          </div>

          {/* Barra de Busca */}
          <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Input
                type="text"
                placeholder="Buscar por protocolo, status ou data"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="flex-1 bg-white border-gray-300"
              />
              <Button type="submit" variant="primary" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Buscar
              </Button>
            </div>
          </form>

          {/* Tabela de Solicitações */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Carregando solicitações...</div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                      Protocolo
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                      Data de inclusão
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                      Data do retorno
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                      Feedback
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Nenhuma solicitação encontrada
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request) => {
                      const tipoLabel =
                        request.tipo === "ONG_PENDENTE"
                          ? "ONG Pendente"
                          : request.tipo === "USUARIO_REPORTADO"
                          ? "Usuário Reportado"
                          : "Denúncia Negada"

                      return (
                        <tr
                          key={request.id}
                          onClick={() => handleRowClick(request)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 text-xs sm:text-sm text-gray-900 font-mono">
                            {request.protocolo}
                          </td>
                          <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">{tipoLabel}</td>
                          <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">
                            {formatDateBR(request.dataInclusao)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs sm:text-sm font-medium ${getStatusColor(
                                request.status
                              )} text-gray-800`}
                            >
                              {formatStatus(request.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">
                            {request.dataRetorno ? formatDateBR(request.dataRetorno) : "-"}
                          </td>
                          <td className="px-4 py-3 text-xs sm:text-sm">
                            {request.feedback ? (
                              <span className="text-gray-600">{request.feedback.substring(0, 30)}...</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-[#85A191] text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                aria-label="Próxima página"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Dialog para ONG Pendente */}
      {selectedRequest?.tipo === "ONG_PENDENTE" && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ONG Pendente de Aprovação</DialogTitle>
              <DialogDescription>
                Protocolo: {selectedRequest.protocolo}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome da Organização</label>
                <p className="text-sm text-gray-900 mt-1">{selectedRequest.dados.nomeCompleto || "-"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">E-mail</label>
                <p className="text-sm text-gray-900 mt-1">{selectedRequest.dados.email || "-"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">CNPJ</label>
                <p className="text-sm text-gray-900 mt-1">{selectedRequest.dados.cnpj || "-"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Telefone</label>
                <p className="text-sm text-gray-900 mt-1">{selectedRequest.dados.numeroContato || "-"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Endereço</label>
                <p className="text-sm text-gray-900 mt-1">{selectedRequest.dados.endereco || "-"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Data de Cadastro</label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDateBR(selectedRequest.dados.criadoEm)}
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReprovarDialogOpen(true)
                }}
                className="w-full sm:w-auto"
              >
                Reprovar
              </Button>
              <Button
                onClick={handleAprovarOng}
                style={{ backgroundColor: "#85A191" }}
                className="w-full sm:w-auto text-white hover:opacity-90"
              >
                Aprovar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para Reprovar ONG */}
      {selectedRequest?.tipo === "ONG_PENDENTE" && (
        <Dialog open={isReprovarDialogOpen} onOpenChange={setIsReprovarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reprovar ONG</DialogTitle>
              <DialogDescription>
                Informe o motivo da reprovação. Um e-mail será enviado para a ONG.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Textarea
                placeholder="Digite o motivo da reprovação..."
                value={reprovarMotivo}
                onChange={(e) => setReprovarMotivo(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReprovarDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleReprovarOng}
                style={{ backgroundColor: "#dc2626" }}
                className="text-white hover:opacity-90"
              >
                Confirmar Reprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para Usuário Reportado */}
      {selectedRequest?.tipo === "USUARIO_REPORTADO" && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Usuário Reportado</DialogTitle>
              <DialogDescription>
                Protocolo: {selectedRequest.protocolo}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRequest.dados.nomeCompleto || "-"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">E-mail</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRequest.dados.email || "-"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">CPF</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRequest.dados.cpf || "-"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Telefone</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRequest.dados.numeroContato || "-"}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Histórico de Denúncias
                </label>
                <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  {selectedRequest.dados.denuncias && selectedRequest.dados.denuncias.length > 0 ? (
                    <div className="space-y-3">
                      {selectedRequest.dados.denuncias.map((denuncia: any) => (
                        <div key={denuncia.idDenuncia} className="border-b pb-3 last:border-b-0">
                          <p className="text-sm font-medium text-gray-900">
                            Denúncia #{denuncia.idDenuncia}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Data: {formatDateBR(denuncia.dataRegistro)}
                          </p>
                          {denuncia.descricao && (
                            <p className="text-sm text-gray-700 mt-2">{denuncia.descricao}</p>
                          )}
                          {denuncia.historicos && denuncia.historicos.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              <p>Histórico:</p>
                              {denuncia.historicos.map((hist: any, idx: number) => (
                                <p key={idx} className="ml-2">
                                  - {hist.observacao || "Sem observação"}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma denúncia encontrada</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleReverterStatus}
                className="w-full sm:w-auto"
              >
                Reverter Status
              </Button>
              <Button
                onClick={handleConfirmarBanimento}
                style={{ backgroundColor: "#dc2626" }}
                className="w-full sm:w-auto text-white hover:opacity-90"
              >
                Confirmar Banimento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para Denúncia Negada */}
      {selectedRequest?.tipo === "DENUNCIA_NEGADA" && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Denúncia Negada</DialogTitle>
              <DialogDescription>
                Protocolo: {selectedRequest.protocolo}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedRequest.dados.descricao || "-"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de Registro</label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedRequest.dados.tipoRegistro || "-"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Localização</label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedRequest.dados.localizacao || "-"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Usuário que Criou</label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedRequest.dados.usuarioCriador?.nomeCompleto || "-"} (
                  {selectedRequest.dados.usuarioCriador?.email || "-"})
                </p>
              </div>

              {selectedRequest.dados.historico && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Motivo da Negativa</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedRequest.dados.historico.observacao || "Sem motivo informado"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Data:{" "}
                    {selectedRequest.dados.historico.dataAlteracao
                      ? formatDateBR(selectedRequest.dados.historico.dataAlteracao)
                      : "-"}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
