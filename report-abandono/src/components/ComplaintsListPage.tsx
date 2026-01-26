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
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Share2,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Tipos para os dados
type ComplaintStatus = 0 | 1 | 2 | 3 // 0: Pendente/Encaminhada, 1: Em análise, 2: Negada, 3: Concluída

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
    0: "Encaminhada",
    1: "Em análise",
    2: "Negada",
    3: "Concluída",
  }
  return statusMap[status]
}

// Função para obter cor do status
const getStatusColor = (status: ComplaintStatus): string => {
  const colorMap: Record<ComplaintStatus, string> = {
    0: "bg-gray-200",
    1: "bg-gray-200",
    2: "bg-[#A4CEBD]",
    3: "bg-gray-300",
  }
  return colorMap[status]
}

// Função para formatar data
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}

// Função para gerar PDF
const generatePDF = async (complaint: Complaint) => {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Cabeçalho com logo e título
    doc.setFillColor(164, 206, 189) // #A4CEBD
    doc.rect(0, 0, pageWidth, 30, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.text("ReportAbandono", pageWidth / 2, 20, { align: "center" })

    // Título do documento
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
    doc.text(formatDate(complaint.dataInclusao), 60, yPos)
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
        const statusAnterior = historico.statusAnterior !== null ? formatStatus(historico.statusAnterior as ComplaintStatus) : "-"
        const statusNovo = historico.statusNovo !== null ? formatStatus(historico.statusNovo as ComplaintStatus) : "-"
        const data = formatDate(historico.dataAlteracao)
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

export function ComplaintsListPage() {
  const { token, isAuthenticated } = useAuth()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Estados para dialogs
  const [viewFeedbackDialog, setViewFeedbackDialog] = useState<{
    open: boolean
    feedback: string
  }>({ open: false, feedback: "" })
  const [contestDialog, setContestDialog] = useState<{
    open: boolean
    complaintId: string | null
    justificativa: string
  }>({ open: false, complaintId: null, justificativa: "" })
  const [shareDialog, setShareDialog] = useState<{
    open: boolean
    complaint: Complaint | null
  }>({ open: false, complaint: null })
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean
    complaintId: string | null
  }>({ open: false, complaintId: null })

  // Buscar denúncias do backend
  useEffect(() => {
    const fetchComplaints = async () => {
      if (!isAuthenticated || !token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch("http://localhost:3333/denuncias/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Erro ao buscar denúncias")
        }

        const data = await response.json()
        setComplaints(data.denuncias || [])
      } catch (error) {
        console.error("Erro ao buscar denúncias:", error)
        showErrorToast("Erro ao carregar denúncias", "Não foi possível carregar suas denúncias. Tente novamente.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchComplaints()
  }, [isAuthenticated, token])

  // Calcular contadores de status
  const statusCounts = useMemo(() => {
    return {
      encaminhada: complaints.filter((c) => c.status === 0).length,
      em_analise: complaints.filter((c) => c.status === 1).length,
      negada: complaints.filter((c) => c.status === 2).length,
      concluida: complaints.filter((c) => c.status === 3).length,
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

  const handleViewFeedback = (complaint: Complaint) => {
    if (complaint.feedback) {
      setViewFeedbackDialog({ open: true, feedback: complaint.feedback })
    }
  }

  const handleContest = (complaint: Complaint) => {
    setContestDialog({ open: true, complaintId: complaint.id, justificativa: "" })
  }

  const handleConfirmContest = async () => {
    if (!token || !contestDialog.complaintId || !contestDialog.justificativa.trim()) {
      showErrorToast("Justificativa obrigatória", "Por favor, informe a justificativa da contestação.")
      return
    }

    try {
      const response = await fetch(
        `http://localhost:3333/denuncias/${contestDialog.complaintId}/contestar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ justificativa: contestDialog.justificativa }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao contestar denúncia")
      }

      showSuccessToast("Denúncia contestada", "A denúncia foi contestada com sucesso.")
      setContestDialog({ open: false, complaintId: null, justificativa: "" })

      // Recarregar lista
      const refreshResponse = await fetch("http://localhost:3333/denuncias/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setComplaints(data.denuncias || [])
      }
    } catch (error: any) {
      showErrorToast("Erro ao contestar", error.message || "Não foi possível contestar a denúncia.")
    }
  }

  const handleDelete = (complaint: Complaint) => {
    setDeleteConfirmDialog({ open: true, complaintId: complaint.id })
  }

  const handleConfirmDelete = async () => {
    if (!token || !deleteConfirmDialog.complaintId) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3333/denuncias/${deleteConfirmDialog.complaintId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao excluir denúncia")
      }

      showSuccessToast("Denúncia excluída", "A denúncia foi excluída com sucesso.")
      setDeleteConfirmDialog({ open: false, complaintId: null })

      // Recarregar lista
      const refreshResponse = await fetch("http://localhost:3333/denuncias/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setComplaints(data.denuncias || [])
      }
    } catch (error: any) {
      showErrorToast("Erro ao excluir", error.message || "Não foi possível excluir a denúncia.")
    }
  }

  const handleShare = async (complaint: Complaint) => {
    // Buscar dados completos da denúncia para o PDF
    if (!token) return

    try {
      const response = await fetch(`http://localhost:3333/denuncias/${complaint.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar dados da denúncia")
      }

      const data = await response.json()
      setShareDialog({ open: true, complaint: data.denuncia })
    } catch (error) {
      showErrorToast("Erro ao carregar dados", "Não foi possível carregar os dados da denúncia.")
    }
  }

  const handleDownloadPDF = () => {
    if (shareDialog.complaint) {
      generatePDF(shareDialog.complaint)
    }
  }

  const handleShareLink = async () => {
    if (shareDialog.complaint) {
      const url = `${window.location.origin}/denuncias?protocolo=${shareDialog.complaint.protocolo}`
      try {
        if (navigator.share) {
          await navigator.share({
            title: `Denúncia ${shareDialog.complaint.protocolo}`,
            text: `Protocolo: ${shareDialog.complaint.protocolo}`,
            url: url,
          })
        } else {
          await navigator.clipboard.writeText(url)
          showSuccessToast("Link copiado", "O link foi copiado para a área de transferência.")
        }
      } catch (error) {
        // Usuário cancelou ou erro
        console.error("Erro ao compartilhar:", error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Carregando denúncias...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />

      <main className="flex-1 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Título */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-6 sm:mb-8 text-center">
            Lista de denúncias
          </h1>

          {/* Cards de Resumo de Status */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Encaminhadas */}
            <div className="bg-gray-200 rounded-lg p-4 sm:p-5 flex flex-col items-center gap-2">
              <ArrowRightLeft className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
              <h3 className="text-sm sm:text-base font-medium text-gray-800">Encaminhadas</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{statusCounts.encaminhada}</p>
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

          {/* Tabela de Denúncias */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
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
                  paginatedComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-900 font-mono">
                        {complaint.protocolo}
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">
                        {formatDate(complaint.dataInclusao)}
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
                        {complaint.dataRetorno ? formatDate(complaint.dataRetorno) : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm">
                        {complaint.feedback ? (
                          <button
                            onClick={() => handleViewFeedback(complaint)}
                            className="text-[#85A191] hover:text-[#85A191]/80 underline"
                          >
                            Ver retorno
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
                          {complaint.status === 3 && (
                            <button
                              onClick={() => handleContest(complaint)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              aria-label="Contestar"
                            >
                              <MessageSquare className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          {complaint.status === 0 && (
                            <button
                              onClick={() => handleDelete(complaint)}
                              className="p-1.5 hover:bg-red-50 rounded transition-colors"
                              aria-label="Excluir"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

      {/* Dialog Ver Retorno */}
      <Dialog open={viewFeedbackDialog.open} onOpenChange={(open: boolean) => setViewFeedbackDialog({ open, feedback: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retorno da Denúncia</DialogTitle>
            <DialogDescription>Feedback sobre o andamento da sua denúncia</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 whitespace-pre-wrap">{viewFeedbackDialog.feedback}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewFeedbackDialog({ open: false, feedback: "" })}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Contestar */}
      <Dialog
        open={contestDialog.open}
        onOpenChange={(open: boolean) => setContestDialog({ open, complaintId: null, justificativa: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contestar Denúncia</DialogTitle>
            <DialogDescription>Informe a justificativa para contestar esta denúncia</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Digite a justificativa da contestação..."
              value={contestDialog.justificativa}
              onChange={(e) => setContestDialog({ ...contestDialog, justificativa: e.target.value })}
              className="min-h-[120px] bg-gray-100 border-gray-300"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContestDialog({ open: false, complaintId: null, justificativa: "" })}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirmContest}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Compartilhar */}
      <Dialog
        open={shareDialog.open}
        onOpenChange={(open: boolean) => setShareDialog({ open, complaint: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Denúncia</DialogTitle>
            <DialogDescription>
              {shareDialog.complaint && (
                <>
                  <p className="font-semibold mt-2">Protocolo: {shareDialog.complaint.protocolo}</p>
                  {shareDialog.complaint.descricao && (
                    <p className="mt-2 text-gray-600">{shareDialog.complaint.descricao}</p>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} className="w-full sm:w-auto">
              Baixar PDF
            </Button>
            <Button variant="primary" onClick={handleShareLink} className="w-full sm:w-auto">
              Compartilhar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShareDialog({ open: false, complaint: null })}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog
        open={deleteConfirmDialog.open}
        onOpenChange={(open: boolean) => setDeleteConfirmDialog({ open, complaintId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta denúncia? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialog({ open: false, complaintId: null })}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
