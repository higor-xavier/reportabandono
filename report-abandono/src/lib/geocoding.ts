/**
 * Serviço de Geocodificação Reutilizável
 * Usa OpenStreetMap Nominatim API para converter endereços em coordenadas
 */

export interface AddressData {
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Converte um endereço em coordenadas (Geocodificação Direta)
 * @param address Dados do endereço (logradouro, numero, bairro, cep)
 * @returns Coordenadas (latitude, longitude) ou null se não encontrado
 */
export async function getCoordinatesFromAddress(
  address: AddressData
): Promise<Coordinates | null> {
  try {
    // Montar string de endereço para busca
    const addressString = [
      address.logradouro,
      address.numero,
      address.bairro,
      address.cep.replace(/\D/g, ""), // Remover formatação do CEP
    ]
      .filter(Boolean) // Remover valores vazios
      .join(", ");

    // Fazer requisição para Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        addressString
      )}&limit=1&addressdetails=1`,
      {
        headers: {
          "User-Agent": "ReportAbandono/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar coordenadas");
    }

    const data = await response.json();

    // Se não encontrou resultados
    if (!data || data.length === 0) {
      return null;
    }

    // Retornar coordenadas do primeiro resultado
    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
  } catch (error) {
    console.error("Erro na geocodificação:", error);
    return null;
  }
}
