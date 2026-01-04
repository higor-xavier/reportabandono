import { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { toBlob } from "html-to-image" // <--- NOVA IMPORTAÇÃO
import { NavigationHeader } from "./NavigationHeader"
import { Plus, Share2 } from "lucide-react"
import "leaflet/dist/leaflet.css"

// Coordenadas de Teófilo Otoni, MG (Avenida Alfredo Sá)
const DEFAULT_CENTER: [number, number] = [-17.8575, -41.5053]
const DEFAULT_ZOOM = 15 // Ajustei o zoom (25 é muito alto para visualização inicial)

interface Complaint {
  id: string
  protocolo: string
  latitude: number
  longitude: number
  dataInclusao: string
  descricao?: string
}

const mockComplaints: Complaint[] = [
  {
    id: "1",
    protocolo: "125ds85E",
    latitude: -17.8575,
    longitude: -41.5053,
    dataInclusao: "12/12/2023",
    descricao: "Animal abandonado na Avenida Alfredo Sá",
  },
  {
    id: "2",
    protocolo: "125523bD",
    latitude: -17.8580,
    longitude: -41.5060,
    dataInclusao: "10/12/2023",
    descricao: "Cachorro encontrado na região",
  },
  {
    id: "3",
    protocolo: "1523sA3c",
    latitude: -17.8570,
    longitude: -41.5045,
    dataInclusao: "09/12/2023",
    descricao: "Gato abandonado próximo à praça",
  },
]

// Componente para atualizar o mapa
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  return null
}

export function TrackingPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints)
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Ref para o container do mapa
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Configuração dos ícones do Leaflet
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  }, [])

  // --- FUNÇÃO DE COMPARTILHAMENTO ATUALIZADA ---
  const handleShareMap = async () => {
    if (!mapRef.current) return

    try {
      setIsLoading(true) // Opcional: mostrar loading visual

      // O html-to-image lida com oklch e estilos modernos automaticamente
      // O 'filter' remove os controles de zoom (+/-) da imagem final para ficar mais limpo
      const blob = await toBlob(mapRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        filter: (node) => {
          // Excluir botões de controle do Leaflet da captura
          if (node.classList && node.classList.contains('leaflet-control-container')) {
             return false;
          }
          return true;
        }
      })

      if (!blob) throw new Error('Falha ao gerar imagem')

      // Lógica de Compartilhamento (Web Share API vs Download)
      if (navigator.share) {
        const file = new File([blob], 'denuncias-mapa.png', { type: 'image/png' })
        try {
          await navigator.share({
            title: 'Mapa de Denúncias',
            text: 'Confira as incidências de abandono na região.',
            files: [file],
          })
        } catch (err) {
            // Ignorar erro se usuário cancelou o modal de share
            if ((err as Error).name !== 'AbortError') {
                 console.error("Erro no share nativo:", err);
                 downloadImage(blob); // Fallback
            }
        }
      } else {
        downloadImage(blob)
      }

    } catch (error) {
      console.error('Erro ao capturar mapa:', error)
      alert('Não foi possível gerar a imagem do mapa.')
    } finally {
        setIsLoading(false)
    }
  }

  const downloadImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'mapa-denuncias.png'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />

      <main className="flex-1 flex flex-col px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-6 sm:mb-8 text-center">
            Locais de incidências
          </h1>

          {/* Container Principal do Mapa com REF para captura */}
          <div 
            ref={mapRef}
            className="relative flex-1 bg-white rounded-lg shadow-md overflow-hidden min-h-[500px]"
          >
            {!isClient ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">Carregando mapa...</p>
              </div>
            ) : (
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                style={{ height: "100%", width: "100%", minHeight: "80vh" }}
                scrollWheelZoom={true}
                // Adicione esta classe para garantir que o CSS do leaflet funcione corretamente
                className="z-0" 
              >
                <MapUpdater center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {complaints.map((complaint) => (
                  <Marker
                    key={complaint.id}
                    position={[complaint.latitude, complaint.longitude]}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold text-sm text-gray-900">
                          Protocolo: {complaint.protocolo}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Data: {complaint.dataInclusao}
                        </p>
                        {complaint.descricao && (
                          <p className="text-xs text-gray-700 mt-2">
                            {complaint.descricao}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
            
            {/* IMPORTANTE: Os botões ficam DENTRO do container relativo principal, 
                mas vamos usar uma técnica 'data-html2canvas-ignore' ou filtro 
                para não saírem na foto se não quiser.
                Neste caso, deixei eles fora da div `ref={mapRef}` na estrutura visual abaixo
                para facilitar a captura APENAS do mapa limpo.
            */}
          </div>

          {/* Mudei os botões para FORA da div ref={mapRef} para eles não saírem no print */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
            <Link
              to="/registrardenuncia"
              className="bg-[#85A191] hover:bg-[#85A191]/90 text-white rounded-full p-4 shadow-lg transition-colors flex items-center justify-center"
            >
              <Plus className="w-6 h-6" />
            </Link>

            <button
              onClick={handleShareMap}
              disabled={isLoading}
              className="bg-white hover:bg-gray-50 text-gray-700 rounded-full p-4 shadow-lg transition-colors flex items-center justify-center border border-gray-200"
            >
              <Share2 className={`w-6 h-6 ${isLoading ? 'animate-pulse text-gray-400' : ''}`} />
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}