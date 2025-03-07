import { reverseGeocodeAsync, LocationObjectCoords } from "expo-location"

export async function getAddressLocation({
  latitude,
  longitude,
}: LocationObjectCoords) {
  try {
    const location = await reverseGeocodeAsync({ latitude, longitude })
    return location[0]?.street
  } catch (error) {
    return "Endereço não encontrado"
  }
}
