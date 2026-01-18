import { useState, useEffect, useRef } from "react"
import { NavigationHeader } from "./NavigationHeader"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { ToggleGroup } from "./ui/toggle-group"
import { Upload, MapPin } from "lucide-react"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import { useAuth } from "@/contexts/AuthContext"
import { getCoordinatesFromAddress, type AddressData } from "@/lib/geocoding"

type ComplaintType = "person" | "animal"

export function RegisterReportPage() {
  const { user, token, isAuthenticated } = useAuth()
  const [complaintType, setComplaintType] = useState<ComplaintType>("person")
  const [details, setDetails] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [address, setAddress] = useState<AddressData>({
    logradouro: "",
    numero: "",
    bairro: "",
    cep: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Função para formatar CEP
  const formatCEP = (value: string): string => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{5})(\d{0,3})/, "$1-$2")
  }

  // Função para obter endereço via reverse geocoding
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      setIsLoadingLocation(true)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "User-Agent": "ReportAbandono/1.0",
          },
        }
      )

      if (!response.ok) {
        throw new Error("Erro ao obter endereço")
      }

      const data = await response.json()
      const addressData = data.address || {}

      setAddress({
        logradouro: addressData.road || addressData.street || "",
        numero: addressData.house_number || "",
        bairro: addressData.suburb || addressData.neighbourhood || addressData.quarter || "",
        cep: addressData.postcode || "",
      })

      // Armazenar coordenadas obtidas via GPS
      setCoordinates({ latitude: lat, longitude: lng })

      showSuccessToast("Localização obtida", "Endereço preenchido automaticamente via GPS")
    } catch (error) {
      console.error("Erro ao obter endereço:", error)
      showErrorToast("Erro ao obter localização", "Não foi possível obter o endereço automaticamente. Por favor, preencha manualmente.")
    } finally {
      setIsLoadingLocation(false)
    }
  }

  // Obter localização via GPS e preencher endereço automaticamente
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          fetchAddressFromCoordinates(latitude, longitude)
        },
        (error) => {
          console.error("Erro ao obter localização:", error)
          showErrorToast(
            "Erro ao obter localização",
            "Não foi possível acessar sua localização. Por favor, preencha o endereço manualmente."
          )
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    } else {
      showErrorToast(
        "Geolocalização não disponível",
        "Seu navegador não suporta geolocalização. Por favor, preencha o endereço manualmente."
      )
    }
  }, [])

  // Validação de arquivos de mídia
  const validateMediaFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"]

    if (file.size > maxSize) {
      showErrorToast("Arquivo muito grande", "O arquivo deve ter no máximo 10MB")
      return false
    }

    if (!allowedImageTypes.includes(file.type) && !allowedVideoTypes.includes(file.type)) {
      showErrorToast("Tipo de arquivo inválido", "Apenas imagens (JPEG, PNG, WebP) e vídeos (MP4, WebM) são permitidos")
      return false
    }

    return true
  }

  // Handler para upload de mídia
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles = Array.from(files).filter(validateMediaFile)
    
    if (newFiles.length > 0) {
      setMediaFiles((prev) => [...prev, ...newFiles])
      showSuccessToast("Mídia adicionada", `${newFiles.length} arquivo(s) adicionado(s) com sucesso`)
    }

    // Limpar input para permitir adicionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Remover arquivo de mídia
  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Validação do formulário
  const validateForm = (): boolean => {
    if (!details.trim()) {
      showErrorToast(
        "Campo obrigatório",
        complaintType === "person"
          ? "Por favor, forneça detalhes sobre a pessoa"
          : "Por favor, forneça detalhes sobre como encontrar o animal"
      )
      return false
    }

    if (!address.logradouro.trim()) {
      showErrorToast("Campo obrigatório", "Por favor, preencha o logradouro")
      return false
    }

    if (!address.numero.trim()) {
      showErrorToast("Campo obrigatório", "Por favor, preencha o número")
      return false
    }

    if (!address.bairro.trim()) {
      showErrorToast("Campo obrigatório", "Por favor, preencha o bairro")
      return false
    }

    if (!address.cep.trim()) {
      showErrorToast("Campo obrigatório", "Por favor, preencha o CEP")
      return false
    }

    // Validar formato do CEP
    const cepRegex = /^\d{5}-?\d{3}$/
    if (!cepRegex.test(address.cep.replace(/\D/g, ""))) {
      showErrorToast("CEP inválido", "Por favor, insira um CEP válido no formato 00000-000")
      return false
    }

    return true
  }

  // Handler para submit do formulário
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validar se o usuário está autenticado
    if (!isAuthenticated || !user || !token) {
      showErrorToast("Não autenticado", "É necessário estar logado para registrar uma denúncia.")
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      let finalLatitude: number
      let finalLongitude: number

      // Se já temos coordenadas do GPS, usar elas
      if (coordinates) {
        finalLatitude = coordinates.latitude
        finalLongitude = coordinates.longitude
      } else {
        // Caso contrário, fazer geocodificação do endereço preenchido manualmente
        const coords = await getCoordinatesFromAddress(address)
        
        if (!coords) {
          showErrorToast(
            "Erro ao obter coordenadas",
            "Não foi possível obter as coordenadas do endereço informado. Por favor, tente usar o GPS ou verifique o endereço."
          )
          setIsSubmitting(false)
          return
        }

        finalLatitude = coords.latitude
        finalLongitude = coords.longitude
      }

      // Montar endereço completo para salvar
      const enderecoCompleto = `${address.logradouro}, ${address.numero} - ${address.bairro}, ${address.cep}`

      // Criar FormData para enviar multipart/form-data
      const formData = new FormData()
      
      // Adicionar campos de texto
      formData.append("descricao", details.trim())
      formData.append("tipoRegistro", complaintType === "person" ? "Vi uma pessoa abandonando" : "Somente o animal")
      formData.append("localizacao", enderecoCompleto)
      formData.append("latitude", finalLatitude.toString())
      formData.append("longitude", finalLongitude.toString())

      // Adicionar arquivos de mídia
      mediaFiles.forEach((file) => {
        formData.append("mediaFiles", file)
      })

      // Enviar para o backend
      const response = await fetch("http://localhost:3333/denuncias", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erro ao registrar denúncia")
      }

      const data = await response.json()

      showSuccessToast("Denúncia registrada", `Sua denúncia foi registrada com sucesso! Protocolo: ${data.denuncia.protocolo}`)
      
      // Limpar formulário
      setComplaintType("person")
      setDetails("")
      setMediaFiles([])
      setCoordinates(null)
      setAddress({
        logradouro: "",
        numero: "",
        bairro: "",
        cep: "",
      })
    } catch (error: any) {
      console.error("Erro ao registrar denúncia:", error)
      showErrorToast(
        "Erro ao registrar denúncia",
        error.message || "Ocorreu um erro ao registrar a denúncia. Por favor, tente novamente."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6 sm:mb-8">
            Cadastro de Denúncia
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Seção Denúncia */}
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Denúncia</h2>

              {/* Toggle: Vi uma pessoa abandonando / Somente o animal */}
              <ToggleGroup
                value={complaintType}
                onValueChange={(value) => setComplaintType(value as ComplaintType)}
                options={[
                  { value: "person", label: "Vi uma pessoa abandonando" },
                  { value: "animal", label: "Somente o animal" },
                ]}
                className="justify-center"
              />

              {/* Textarea para detalhes */}
              <div className="space-y-2">
                <label htmlFor="details" className="text-sm font-medium text-gray-700">
                  {complaintType === "person"
                    ? "Forneça detalhes dessa pessoa:"
                    : "Forneça detalhes sobre como encontrar o animal:"}
                </label>
                <Textarea
                  id="details"
                  placeholder={
                    complaintType === "person"
                      ? "Características da pessoa, dados de veículos e testemunhas..."
                      : "Descrição do animal, localização exata, características físicas, estado de saúde, como encontrá-lo..."
                  }
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-gray-100 border-gray-300 min-h-[120px] resize-none"
                />
              </div>

              {/* Botão Adicionar mídia */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="mediaUpload"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 border-gray-300"
                >
                  <Upload className="w-4 h-4" />
                  Adicionar mídia
                </Button>
                {mediaFiles.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {mediaFiles.length} arquivo(s) selecionado(s)
                  </span>
                )}
              </div>

              {/* Preview dos arquivos selecionados */}
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {mediaFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative group border border-gray-300 rounded-lg p-2 bg-gray-50"
                    >
                      <button
                        type="button"
                        onClick={() => removeMediaFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <p className="text-xs text-gray-600 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção Localização */}
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Localização</h2>
              
              {isLoadingLocation && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  <MapPin className="w-4 h-4 animate-pulse" />
                  Obtendo localização automaticamente via GPS...
                </div>
              )}

              {/* Campos de endereço */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Logradouro */}
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="logradouro" className="text-sm font-medium text-gray-700">
                    Logradouro:
                  </label>
                  <Input
                    id="logradouro"
                    type="text"
                    placeholder="Digite a Rua/Avenida/Praça..."
                    value={address.logradouro}
                    onChange={(e) =>
                      setAddress((prev) => ({ ...prev, logradouro: e.target.value }))
                    }
                    className="w-full bg-gray-100 border-gray-300"
                    required
                  />
                </div>

                {/* Número */}
                <div className="space-y-2">
                  <label htmlFor="numero" className="text-sm font-medium text-gray-700">
                    Número:
                  </label>
                  <Input
                    id="numero"
                    type="text"
                    placeholder="Digite o número mais próximo"
                    value={address.numero}
                    onChange={(e) =>
                      setAddress((prev) => ({ ...prev, numero: e.target.value }))
                    }
                    className="w-full bg-gray-100 border-gray-300"
                    required
                  />
                </div>

                {/* Bairro */}
                <div className="space-y-2">
                  <label htmlFor="bairro" className="text-sm font-medium text-gray-700">
                    Bairro:
                  </label>
                  <Input
                    id="bairro"
                    type="text"
                    placeholder="Digite o bairro"
                    value={address.bairro}
                    onChange={(e) =>
                      setAddress((prev) => ({ ...prev, bairro: e.target.value }))
                    }
                    className="w-full bg-gray-100 border-gray-300"
                    required
                  />
                </div>

                {/* CEP */}
                <div className="space-y-2">
                  <label htmlFor="cep" className="text-sm font-medium text-gray-700">
                    CEP:
                  </label>
                  <Input
                    id="cep"
                    type="text"
                    placeholder="Digite o CEP"
                    value={address.cep}
                    onChange={(e) => {
                      const formatted = formatCEP(e.target.value)
                      setAddress((prev) => ({ ...prev, cep: formatted }))
                    }}
                    className="w-full bg-gray-100 border-gray-300"
                    maxLength={9}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Botão Registrar denúncia */}
            <Button
              type="submit"
              variant="primary"
              className="w-full text-base sm:text-lg py-3 sm:py-4"
              disabled={isSubmitting || isLoadingLocation}
            >
              {isSubmitting ? "Registrando..." : "Registrar denúncia"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

