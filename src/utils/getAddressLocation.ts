import { reverseGeocodeAsync } from "expo-location"

type Props = {
  latitude: number
  longitude: number
}

export async function getAddressLocation({ latitude, longitude }: Props) {
  try {
    const location = await reverseGeocodeAsync({ latitude, longitude })
    return location[0]?.street
  } catch (error) {
    return "Endereço não encontrado"
  }
}
