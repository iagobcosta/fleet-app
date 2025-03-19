import {
  Accuracy,
  hasStartedLocationUpdatesAsync,
  startLocationUpdatesAsync,
  stopLocationUpdatesAsync,
} from "expo-location"
import * as TaskManager from "expo-task-manager"
import {
  clearStorageLocation,
  saveStorageLocation,
} from "../libs/asyncStorage/locationStorage"

export const BACKGROUND_LOCATION_TASK_NAME = "background-location-task"

TaskManager.defineTask(
  BACKGROUND_LOCATION_TASK_NAME,
  async ({ data, error }: any) => {
    try {
      if (error) {
        throw error
      }

      if (data) {
        const { coords, timestamp } = data.locations[0]

        const currentLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp,
        }

        await saveStorageLocation(currentLocation)
      }
    } catch (error) {
      console.log("error", error)
      stopLocationTask()
    }
  }
)

export async function startLocationTask() {
  try {
    const hashStarted = await hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME
    )

    if (hashStarted) {
      await stopLocationTask()
    }

    await startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME, {
      accuracy: Accuracy.Highest,
      distanceInterval: 1,
      timeInterval: 1000,
    })
  } catch (error) {
    console.log("error in startLocationTask", error)
  }
}

export async function stopLocationTask() {
  try {
    const hashStarted = await hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME
    )

    if (hashStarted) {
      await stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME)
      await clearStorageLocation()
    }
  } catch (error) {
    console.log("error in stopLocationTask", error)
  }
}
