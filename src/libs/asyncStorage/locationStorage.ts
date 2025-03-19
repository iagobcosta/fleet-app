import AsyncStorage from "@react-native-async-storage/async-storage"

const STORAGE_ASYNC_KEY = "@ignitefleet:location"

export type LocationProps = {
  latitude: number
  longitude: number
  timestamp: number
}

export async function getStorageLocations() {
  const location = await AsyncStorage.getItem(STORAGE_ASYNC_KEY)
  const response = location ? JSON.parse(location) : []

  return response
}

export async function saveStorageLocation(newLocation: LocationProps) {
  const storage = await getStorageLocations()
  storage.push(newLocation)

  await AsyncStorage.setItem(STORAGE_ASYNC_KEY, JSON.stringify(storage))
}

export async function clearStorageLocation() {
  await AsyncStorage.removeItem(STORAGE_ASYNC_KEY)
}
