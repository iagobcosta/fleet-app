import { useCallback, useEffect, useState } from "react"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { Alert, FlatList } from "react-native"
import Toast from "react-native-toast-message"

import { CarStatus } from "../../components/CarStatus"
import { HomeHeader } from "../../components/HomeHeader"
import { HistoricCard, HistoricCardProps } from "../../components/HistoricCard"

import { Container, Content, Label, Title } from "./styles"
import dayjs from "dayjs"
import { CloudArrowUp } from "phosphor-react-native"

import { UploadQueueStats, usePowerSync } from "@powersync/react-native"
import { Historic } from "../../libs/powerSync/Historic"
import {
  getLastAsyncTimestamp,
  saveLastSyncTimestamp,
} from "../../libs/asyncStorage/syncStorage"
import { TopMessage } from "../../components/TopMessage"

export function Home() {
  const [vehicleInUse, setVehicleInUse] = useState<Historic | null>(null)

  const [historicList, setHistoricList] = useState<HistoricCardProps[]>([])
  const [percentageToSync, setPercentageToSync] = useState<string | null>(null)

  const db = usePowerSync()

  const { navigate } = useNavigation()

  function handleRegisterMovement() {
    if (vehicleInUse?.id) {
      navigate("arrival", {
        id: vehicleInUse.id.toString(),
      })
    } else {
      navigate("departure")
    }
  }

  async function fetchHistoricInUse() {
    try {
      setVehicleInUse(null)
      await db
        .get("SELECT * FROM Historic WHERE status = 'departure'")
        .then((result) => {
          setVehicleInUse(result as Historic)
        })
    } catch (error) {
      console.log(error)
    }
  }

  async function fetchHistoric() {
    try {
      const lastSync = await getLastAsyncTimestamp()

      await db
        .getAll(
          'SELECT * FROM Historic WHERE status = "arrival" ORDER BY created_at DESC'
        )
        .then((result) => {
          const historicItems = result as Historic[]
          const formattedHistoric = historicItems.map((item) => {
            return {
              id: item.id,
              licensePlate: item.license_plate,
              created: dayjs(item.created_at).format(
                "[Saída em] DD/MM/YYYY [às] HH:mm"
              ),
              // isSynced: lastSync > new Date(item?.updated_at!).getTime(),
              isSynced: dayjs(item?.updated_at!).isBefore(lastSync),
            }
          })

          setHistoricList(formattedHistoric as HistoricCardProps[])
        })
        .catch((error) => {
          console.log(error)
        })
    } catch (error) {
      console.log(error)
      Alert.alert("Histórico", "Não foi possível carregar o histórico")
    }
  }

  function handleHistoricDetails(id: string) {
    navigate("arrival", {
      id,
    })
  }

  async function handleProgress(stats: UploadQueueStats) {
    let percentage = 100

    if (stats.size !== null && stats.size > 0) {
      percentage = (stats.count / stats.size) * 100
    }

    if (percentage === 100) {
      await saveLastSyncTimestamp()
      await fetchHistoric()
      setPercentageToSync(null)

      Toast.show({
        type: "info",
        text1: "Todos dados foram sincronizados",
      })

      return true
    }

    if (percentage < 100) {
      setPercentageToSync(`${percentage.toFixed(0)}% sincronizado`)
      return false
    }
  }

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        db.getUploadQueueStats(true).then((stats) => {
          const synced = handleProgress(stats)
          synced.then((result) => {
            if (result) {
              clearInterval(interval)
            }
          })
        })
      }, 1000)

      return () => clearInterval(interval)
    }, [])
  )

  useFocusEffect(
    useCallback(() => {
      fetchHistoricInUse()
      fetchHistoric()
    }, [])
  )

  return (
    <Container>
      {percentageToSync && (
        <TopMessage title={percentageToSync} icon={CloudArrowUp} />
      )}
      <HomeHeader />

      <Content>
        <CarStatus
          licensePlate={vehicleInUse?.license_plate}
          onPress={handleRegisterMovement}
        />

        <Title>Histórico</Title>

        <FlatList
          data={historicList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoricCard
              data={item}
              onPress={() => handleHistoricDetails(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Label>Nenhum veículo utilizado</Label>}
        />
      </Content>
    </Container>
  )
}
