import { useState, useMemo } from "react"
import { NavigationHeader } from "./NavigationHeader"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
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

// Tipos para os dados
type ComplaintStatus = "encaminhada" | "em_analise" | "negada" | "concluida"

interface Complaint {
  id: string
  protocolo: string
  dataInclusao: string
  status: ComplaintStatus
  dataRetorno: string | null
  feedback: string | null
}

// Dados estáticos (serão substituídos por dados do backend)
const mockComplaints: Complaint[] = [
  {
    id: "1",
    protocolo: "125ds85E",
    dataInclusao: "12/12/2023",
    status: "encaminhada",
    dataRetorno: null,
    feedback: null,
  },
  {
    id: "2",
    protocolo: "125523bD",
    dataInclusao: "10/12/2023",
    status: "em_analise",
    dataRetorno: null,
    feedback: null,
  },
  {
    id: "3",
    protocolo: "1523sA3c",
    dataInclusao: "09/12/2023",
    status: "concluida",
    dataRetorno: "09/12/2023",
    feedback: "Denúncia analisada e ação tomada",
  },
  {
    id: "4",
    protocolo: "125ds85F",
    dataInclusao: "08/12/2023",
    status: "concluida",
    dataRetorno: "08/12/2023",
    feedback: "Denúncia analisada e ação tomada",
  },
  {
    id: "5",
    protocolo: "125ds85G",
    dataInclusao: "07/12/2023",
    status: "concluida",
    dataRetorno: "07/12/2023",
    feedback: "Denúncia analisada e ação tomada",
  },
  {
    id: "6",
    protocolo: "125ds85H",
    dataInclusao: "06/12/2023",
    status: "concluida",
    dataRetorno: "06/12/2023",
    feedback: "Denúncia analisada e ação tomada",
  },
]

// Função para formatar status
const formatStatus = (status: ComplaintStatus): string => {
  const statusMap: Record<ComplaintStatus, string> = {
    encaminhada: "Encaminhada",
    em_analise: "Em análise",
    negada: "Negada",
    concluida: "Concluída",
  }
  return statusMap[status]
}

// Função para obter cor do status
const getStatusColor = (status: ComplaintStatus): string => {
  const colorMap: Record<ComplaintStatus, string> = {
    encaminhada: "bg-gray-200",
    em_analise: "bg-gray-200",
    negada: "bg-gray-300",
    concluida: "bg-[#A4CEBD]",
  }
  return colorMap[status]
}

export function ComplaintsListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // TODO: Substituir por chamada à API quando o backend estiver pronto
  // const [complaints, setComplaints] = useState<Complaint[]>([])
  // const [isLoading, setIsLoading] = useState(false)
  // 
  // useEffect(() => {
  //   const fetchComplaints = async () => {
  //     setIsLoading(true)
  //     try {
  //       const response = await fetch('/api/complaints')
  //       const data = await response.json()
  //       setComplaints(data)
  //     } catch (error) {
  //       console.error('Erro ao buscar denúncias:', error)
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   }
  //   fetchComplaints()
  // }, [])

  // Usar dados estáticos por enquanto
  const complaints = mockComplaints

  // Calcular contadores de status
  const statusCounts = useMemo(() => {
    return {
      encaminhada: complaints.filter((c) => c.status === "encaminhada").length,
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
    setCurrentPage(1) // Resetar para primeira página ao buscar
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleShare = (complaint: Complaint) => {
    // TODO: Implementar compartilhamento
    console.log("Compartilhar denúncia:", complaint.id)
  }

  const handleComment = (complaint: Complaint) => {
    // TODO: Implementar comentários
    console.log("Comentar denúncia:", complaint.id)
  }

  const handleDelete = (complaint: Complaint) => {
    // TODO: Implementar exclusão
    console.log("Excluir denúncia:", complaint.id)
  }

  const handleViewFeedback = (complaint: Complaint) => {
    // TODO: Implementar visualização de feedback
    console.log("Ver feedback:", complaint.feedback)
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
                  setCurrentPage(1) // Resetar página ao digitar
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
                        {complaint.dataInclusao}
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
                        {complaint.dataRetorno || "-"}
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
                          <button
                            onClick={() => handleComment(complaint)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            aria-label="Comentar"
                          >
                            <MessageSquare className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(complaint)}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors"
                            aria-label="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
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
    </div>
  )
}

