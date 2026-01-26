import { useState, useMemo, useEffect } from "react"
import { NavigationHeader } from "./NavigationHeader"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import {
  Sun,
  Clock,
  CheckCircle,
  Search,
  Share2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Tipos para os dados
type ComplaintStatus = "nova" | "em_analise" | "negada" | "concluida"

interface Complaint {
  id: string
  protocolo: string
  dataInclusao: string
  status: ComplaintStatus
  dataRetorno: string | null
  feedback: string | null
  descricao?: string
  tipoRegistro?: string
  localizacao?: string
  latitude?: number | string
  longitude?: number | string
  fkResponsavelId?: number | null
  usuarioCriador?: {
    id: number
    nomeCompleto: string | null
    email: string
  }
  midias?: Array<{
    idMidia: number
    caminhoArquivo: string
    tipoMidia: string
    dataEnvio: string
  }>
  historicos?: Array<{
    idHistorico: number
    statusAnterior: number | null
    statusNovo: number | null
    dataAlteracao: string
    observacao: string | null
  }>
}

// Função para formatar status
const formatStatus = (status: ComplaintStatus): string => {
  const statusMap: Record<ComplaintStatus, string> = {
    nova: "Nova",
    em_analise: "Em análise",
    negada: "Negada",
    concluida: "Concluída",
  }
  return statusMap[status]
}

// Função para obter cor do status
const getStatusColor = (status: ComplaintStatus): string => {
  const colorMap: Record<ComplaintStatus, string> = {
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

// Função para formatar status numérico para texto
const formatStatusNum = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: "Pendente",
    1: "Em Análise",
    2: "Negada",
    3: "Concluída",
  }
  return statusMap[status] || "Desconhecido"
}

// Função para gerar PDF
const generatePDF = async (complaint: Complaint) => {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Cabeçalho
    doc.setFillColor(164, 206, 189) // #A4CEBD
    doc.rect(0, 0, pageWidth, 30, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.text("ReportAbandono", pageWidth / 2, 20, { align: "center" })

    // Título
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.text("Relatório de Denúncia", pageWidth / 2, 45, { align: "center" })

    let yPos = 55

    // Dados da denúncia
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Protocolo:", 20, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(complaint.protocolo, 60, yPos)
    yPos += 7

    doc.setFont("helvetica", "bold")
    doc.text("Data de Inclusão:", 20, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(formatDateBR(complaint.dataInclusao), 60, yPos)
    yPos += 7

    doc.setFont("helvetica", "bold")
    doc.text("Status:", 20, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(formatStatus(complaint.status), 60, yPos)
    yPos += 7

    if (complaint.tipoRegistro) {
      doc.setFont("helvetica", "bold")
      doc.text("Tipo de Registro:", 20, yPos)
      doc.setFont("helvetica", "normal")
      doc.text(complaint.tipoRegistro, 60, yPos)
      yPos += 7
    }

    if (complaint.localizacao) {
      doc.setFont("helvetica", "bold")
      doc.text("Localização:", 20, yPos)
      doc.setFont("helvetica", "normal")
      const localizacaoLines = doc.splitTextToSize(complaint.localizacao, pageWidth - 60)
      doc.text(localizacaoLines, 60, yPos)
      yPos += localizacaoLines.length * 5 + 2
    }

    if (complaint.descricao) {
      yPos += 5
      doc.setFont("helvetica", "bold")
      doc.text("Descrição:", 20, yPos)
      yPos += 5
      doc.setFont("helvetica", "normal")
      const descricaoLines = doc.splitTextToSize(complaint.descricao, pageWidth - 40)
      doc.text(descricaoLines, 20, yPos)
      yPos += descricaoLines.length * 5 + 5
    }

    // Lista de mídias
    if (complaint.midias && complaint.midias.length > 0) {
      yPos += 5
      doc.setFont("helvetica", "bold")
      doc.text("Mídias:", 20, yPos)
      yPos += 5
      doc.setFont("helvetica", "normal")
      complaint.midias.forEach((midia, index) => {
        const url = `http://localhost:3333/uploads/${midia.caminhoArquivo || ""}`
        doc.text(`${index + 1}. ${midia.tipoMidia || "Mídia"}: ${url}`, 20, yPos)
        yPos += 5
      })
    }

    // Tabela de histórico
    if (complaint.historicos && complaint.historicos.length > 0) {
      yPos += 10
      doc.setFont("helvetica", "bold")
      doc.text("Histórico de Alterações:", 20, yPos)
      yPos += 5

      const tableData = complaint.historicos.map((historico) => {
        const statusAnterior =
          historico.statusAnterior !== null ? formatStatusNum(historico.statusAnterior) : "-"
        const statusNovo = historico.statusNovo !== null ? formatStatusNum(historico.statusNovo) : "-"
        const data = formatDateBR(historico.dataAlteracao)
        const observacao = historico.observacao || "-"

        return [data, statusAnterior, statusNovo, observacao]
      })

      autoTable(doc, {
        startY: yPos,
        head: [["Data", "Status Anterior", "Status Novo", "Observação"]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [164, 206, 189] },
        margin: { left: 20, right: 20 },
      })
    }

    // Salvar PDF
    doc.save(`denuncia-${complaint.protocolo}.pdf`)
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    showErrorToast("Erro ao gerar PDF", "Não foi possível gerar o PDF. Tente novamente.")
  }
}

const API_BASE_URL = "http://localhost:3333"

export function ComplaintsManagementPage() {
  const { token, isAuthenticated } = useAuth()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [solucaoText, setSolucaoText] = useState("")
  const [justificativaText, setJustificativaText] = useState("")
  const [reportMotivo, setReportMotivo] = useState("")
  const itemsPerPage = 5

  // Buscar denúncias do backend
  useEffect(() => {
    const fetchComplaints = async () => {
      if (!isAuthenticated || !token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch(`${API_BASE_URL}/denuncias/ong`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          // Tratar erros de autenticação/autorização
          if (response.status === 401) {
            showErrorToast("Não autenticado", "Sua sessão expirou. Por favor, faça login novamente.")
            // Redirecionar para login se necessário
            return
          }
          
          if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}))
            showErrorToast(
              "Acesso negado",
              errorData.message || "Você não tem permissão para acessar esta página. Apenas ONGs podem acessar."
            )
            return
          }

          // Outros erros
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || "Erro ao buscar denúncias")
        }

        const data = await response.json()
        setComplaints(data.denuncias || [])
      } catch (error: any) {
        console.error("Erro ao buscar denúncias:", error)
        showErrorToast(
          "Erro ao carregar denúncias",
          error.message || "Não foi possível carregar as denúncias. Tente novamente."
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchComplaints()
  }, [isAuthenticated, token])

  // Calcular contadores de status
  const statusCounts = useMemo(() => {
    return {
      nova: complaints.filter((c) => c.status === "nova").length,
      em_analise: complaints.filter((c) => c.status === "em_analise").length,
      negada: complaints.filter((c) => c.status === "negada").length,
      concluida: complaints.filter((c) => c.status === "concluida").length,
    }
  }, [complaints])

  // Filtrar denúncias baseado na busca
  const filteredComplaints = useMemo(() => {
    if (!searchTerm.trim()) {
      return complaints
    }

    const term = searchTerm.toLowerCase()
    return complaints.filter((complaint) => {
      return (
        complaint.protocolo.toLowerCase().includes(term) ||
        complaint.dataInclusao.includes(term) ||
        formatStatus(complaint.status).toLowerCase().includes(term) ||
        (complaint.dataRetorno && complaint.dataRetorno.includes(term))
      )
    })
  }, [complaints, searchTerm])

  // Paginação
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex)

  // Handlers
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleOpenComplaint = async (complaint: Complaint) => {
    try {
      // Se status for "nova", abrir a denúncia primeiro
      if (complaint.status === "nova") {
        const response = await fetch(`${API_BASE_URL}/denuncias/${complaint.id}/abrir`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "Erro ao abrir denúncia")
        }

        showSuccessToast("Denúncia aberta", "A denúncia foi atribuída à sua ONG")
      }

      // Buscar detalhes completos
      const detailResponse = await fetch(`${API_BASE_URL}/denuncias/ong/${complaint.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!detailResponse.ok) {
        throw new Error("Erro ao buscar detalhes")
      }

      const detailData = await detailResponse.json()
      setSelectedComplaint(detailData.denuncia)
      setIsDetailDialogOpen(true)
      setSolucaoText("")
      setJustificativaText("")

      // Recarregar lista
      const refreshResponse = await fetch(`${API_BASE_URL}/denuncias/ong`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        setComplaints(refreshData.denuncias || [])
      }
    } catch (error: any) {
      showErrorToast("Erro ao abrir denúncia", error.message)
    }
  }

  const handleConclude = async () => {
    if (!selectedComplaint || !solucaoText.trim()) {
      showErrorToast("Campo obrigatório", "Por favor, informe a solução tomada")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/denuncias/${selectedComplaint.id}/concluir`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ solucao: solucaoText }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao concluir denúncia")
      }

      showSuccessToast("Denúncia concluída", "A denúncia foi concluída com sucesso")
      setIsDetailDialogOpen(false)
      setSelectedComplaint(null)
      setSolucaoText("")

      // Recarregar lista
      const refreshResponse = await fetch(`${API_BASE_URL}/denuncias/ong`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        setComplaints(refreshData.denuncias || [])
      }
    } catch (error: any) {
      showErrorToast("Erro ao concluir denúncia", error.message)
    }
  }

  const handleDeny = async () => {
    if (!selectedComplaint || !justificativaText.trim()) {
      showErrorToast("Campo obrigatório", "Por favor, informe a justificativa")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/denuncias/${selectedComplaint.id}/negar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ justificativa: justificativaText }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao negar denúncia")
      }

      showSuccessToast("Denúncia negada", "A denúncia foi negada com sucesso")
      setIsDetailDialogOpen(false)
      setSelectedComplaint(null)
      setJustificativaText("")

      // Recarregar lista
      const refreshResponse = await fetch(`${API_BASE_URL}/denuncias/ong`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        setComplaints(refreshData.denuncias || [])
      }
    } catch (error: any) {
      showErrorToast("Erro ao negar denúncia", error.message)
    }
  }

  const handleShare = async (complaint: Complaint) => {
    try {
      // Buscar detalhes completos para o PDF
      const response = await fetch(`${API_BASE_URL}/denuncias/ong/${complaint.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar detalhes")
      }

      const data = await response.json()
      setSelectedComplaint(data.denuncia)
      setIsShareDialogOpen(true)
    } catch (error: any) {
      showErrorToast("Erro ao buscar detalhes", error.message)
    }
  }

  const handleDownloadPDF = () => {
    if (selectedComplaint) {
      generatePDF(selectedComplaint)
      setIsShareDialogOpen(false)
    }
  }

  const handleReportUser = async (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setIsReportDialogOpen(true)
    setReportMotivo("")
  }

  const handleConfirmReport = async () => {
    if (!selectedComplaint || !reportMotivo.trim()) {
      showErrorToast("Campo obrigatório", "Por favor, informe o motivo do reporte")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/denuncias/${selectedComplaint.id}/reportar-usuario`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ motivo: reportMotivo }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao reportar usuário")
      }

      showSuccessToast("Usuário reportado", "O usuário foi reportado e será analisado pelo administrador")
      setIsReportDialogOpen(false)
      setSelectedComplaint(null)
      setReportMotivo("")
    } catch (error: any) {
      showErrorToast("Erro ao reportar usuário", error.message)
    }
  }

  // Função para obter texto do feedback baseado no status
  const getFeedbackText = (status: ComplaintStatus, hasFeedback: boolean): string | null => {
    if (hasFeedback) {
      return "Ver retorno"
    }

    switch (status) {
      case "nova":
        return "Abrir"
      case "em_analise":
        return "Dar retorno"
      case "negada":
      case "concluida":
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />

      <main className="flex-1 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Título */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-6 sm:mb-8 text-center">
            Gerenciamento de denúncias
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
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
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

          {/* Tabela de Denúncias */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Carregando denúncias...</div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                      Protocolo
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
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Nenhuma denúncia encontrada
                      </td>
                    </tr>
                  ) : (
                    paginatedComplaints.map((complaint) => {
                      const feedbackText = getFeedbackText(complaint.status, !!complaint.feedback)
                      return (
                        <tr key={complaint.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-xs sm:text-sm text-gray-900 font-mono">
                            {complaint.protocolo}
                          </td>
                          <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">
                            {formatDateBR(complaint.dataInclusao)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs sm:text-sm font-medium ${getStatusColor(
                                complaint.status
                              )} text-gray-800`}
                            >
                              {formatStatus(complaint.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">
                            {complaint.dataRetorno ? formatDateBR(complaint.dataRetorno) : "-"}
                          </td>
                          <td className="px-4 py-3 text-xs sm:text-sm">
                            {feedbackText ? (
                              <button
                                onClick={() => handleOpenComplaint(complaint)}
                                className="text-[#85A191] hover:text-[#85A191]/80 underline"
                              >
                                {feedbackText}
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleShare(complaint)}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                aria-label="Compartilhar"
                              >
                                <Share2 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleReportUser(complaint)}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                aria-label="Reportar usuário"
                              >
                                <MessageSquare className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
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

      {/* Dialog de Detalhes da Denúncia */}
      {selectedComplaint && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Denúncia</DialogTitle>
              <DialogDescription>Protocolo: {selectedComplaint.protocolo}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Dados básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Data de Inclusão</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDateBR(selectedComplaint.dataInclusao)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatStatus(selectedComplaint.status)}
                  </p>
                </div>
                {selectedComplaint.tipoRegistro && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tipo de Registro</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedComplaint.tipoRegistro}</p>
                  </div>
                )}
                {selectedComplaint.localizacao && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Localização</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedComplaint.localizacao}</p>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {selectedComplaint.descricao && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedComplaint.descricao}</p>
                </div>
              )}

              {/* Mídias */}
              {selectedComplaint.midias && selectedComplaint.midias.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Mídias</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedComplaint.midias.map((midia) => (
                      <div key={midia.idMidia} className="border rounded-lg overflow-hidden">
                        {midia.tipoMidia === "Foto" ? (
                          <img
                            src={`http://localhost:3333/uploads/${midia.caminhoArquivo}`}
                            alt={`Mídia ${midia.idMidia}`}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <video
                            src={`http://localhost:3333/uploads/${midia.caminhoArquivo}`}
                            controls
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <p className="text-xs text-gray-600 p-2 text-center">{midia.tipoMidia}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Textarea para solução/justificativa */}
              {selectedComplaint.status === "em_analise" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Solução / Medida Tomada
                    </label>
                    <Textarea
                      placeholder="Descreva a solução ou medida tomada para esta denúncia..."
                      value={solucaoText}
                      onChange={(e) => setSolucaoText(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Justificativa (se negar)
                    </label>
                    <Textarea
                      placeholder="Descreva a justificativa para negar esta denúncia..."
                      value={justificativaText}
                      onChange={(e) => setJustificativaText(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedComplaint.status === "em_analise" && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDeny}
                    disabled={!justificativaText.trim()}
                    className="w-full sm:w-auto"
                  >
                    Negar Denúncia
                  </Button>
                  <Button
                    onClick={handleConclude}
                    disabled={!solucaoText.trim()}
                    style={{ backgroundColor: "#85A191" }}
                    className="w-full sm:w-auto text-white hover:opacity-90"
                  >
                    Concluir Denúncia
                  </Button>
                </>
              )}
              {selectedComplaint.status !== "em_analise" && (
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Fechar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Compartilhamento */}
      {selectedComplaint && (
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compartilhar Denúncia</DialogTitle>
              <DialogDescription>
                Protocolo: {selectedComplaint.protocolo}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm text-gray-700 mb-4">
                Clique no botão abaixo para baixar um PDF com os detalhes da denúncia.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleDownloadPDF}
                style={{ backgroundColor: "#85A191" }}
                className="text-white hover:opacity-90"
              >
                Baixar PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Reportar Usuário */}
      {selectedComplaint && (
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reportar Usuário</DialogTitle>
              <DialogDescription>
                {selectedComplaint.usuarioCriador && (
                  <>
                    Usuário: {selectedComplaint.usuarioCriador.nomeCompleto || "N/A"} (
                    {selectedComplaint.usuarioCriador.email})
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Motivo do Reporte
              </label>
              <Textarea
                placeholder="Descreva o motivo para reportar este usuário..."
                value={reportMotivo}
                onChange={(e) => setReportMotivo(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmReport}
                disabled={!reportMotivo.trim()}
                style={{ backgroundColor: "#dc2626" }}
                className="text-white hover:opacity-90"
              >
                Confirmar Reporte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
