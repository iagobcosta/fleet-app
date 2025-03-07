import "react-native-get-random-values"
import "./src/libs/dayjs"
import { ThemeProvider } from "styled-components/native"
import { StatusBar } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"

// import { RealmProvider, syncConfig } from "./src/libs/realm"

import { PowerSyncContext } from "@powersync/react-native"

import {
  useFonts,
  Roboto_400Regular,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto"
import theme from "./src/theme"

import { AppProvider, UserProvider } from "@realm/react"

import { SignIn } from "./src/screens/SignIn"
import { Loading } from "./src/components/Loading"
import { Routes } from "./src/routes"

import { REALM_APP_ID } from "@env"
import { setupPowerSync } from "./src/libs/powerSync/PowerSync"
import { TopMessage } from "./src/components/TopMessage"
import { WifiSlash } from "phosphor-react-native"
import { useNetInfo } from "@react-native-community/netinfo"

const powerSync = setupPowerSync()

export default function App() {
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_700Bold })
  const netInfo = useNetInfo()

  if (!fontsLoaded) {
    return <Loading />
  }

  return (
    <AppProvider id={REALM_APP_ID}>
      <ThemeProvider theme={theme}>
        <SafeAreaProvider
          style={{ flex: 1, backgroundColor: theme.COLORS.GRAY_800 }}
        >
          <StatusBar
            barStyle="light-content"
            backgroundColor="transparent"
            translucent
          />

          {!netInfo.isConnected && (
            <TopMessage title="Você está off-line" icon={WifiSlash} />
          )}

          <UserProvider fallback={<SignIn />}>
            <PowerSyncContext.Provider value={powerSync}>
              <Routes />
            </PowerSyncContext.Provider>
          </UserProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </AppProvider>
  )
}
