import { AppSchema } from "./Historic"
import {
  AbstractPowerSyncDatabase,
  PowerSyncDatabase,
} from "@powersync/react-native"

import { AUTH_TOKEN, POWERSYNC_ENDPOINT, BACKEND_ENDPOINT } from "@env"

const powerSync = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: "fleet-app",
  },
})

powerSync.init()

class Connector {
  async fetchCredentials() {
    return {
      endpoint: POWERSYNC_ENDPOINT,
      token: AUTH_TOKEN,
    }
  }
  async uploadData(database: AbstractPowerSyncDatabase) {
    const batch = await database.getCrudBatch()
    // console.log("batch", JSON.stringify(batch, null, 2))
    if (batch === null) {
      return
    }
    const result = await fetch(`${BACKEND_ENDPOINT}/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch.crud),
    })
    if (!result.ok) {
      throw new Error("Failed to upload data")
    }
    batch.complete()
  }
}

export const setupPowerSync = (): PowerSyncDatabase => {
  const connector = new Connector()
  powerSync.connect(connector)
  return powerSync
}

export const resetPowerSync = async () => {
  await powerSync.disconnectAndClear()
  setupPowerSync()
}
