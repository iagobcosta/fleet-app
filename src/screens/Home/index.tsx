import { useEffect, useState } from "react"
import { useNavigation } from "@react-navigation/native"
import { Alert, FlatList } from "react-native"

import { useQuery, useRealm } from "../../libs/realm"
import { Historic } from "../../libs/realm/schemas/Historic"

import { CarStatus } from "../../components/CarStatus"
import { HomeHeader } from "../../components/HomeHeader"
import { HistoricCard, HistoricCardProps } from "../../components/HistoricCard"

import { Container, Content, Label, Title } from "./styles"
import dayjs from "dayjs"

export function Home() {
  const [vehicleInUse, setVehicleInUse] = useState<Historic | null>(null)

  const [historicList, setHistoricList] = useState<HistoricCardProps[]>([])

  const { navigate } = useNavigation()

  const realm = useRealm()

  const historic = useQuery(Historic)

  function handleRegisterMovement() {
    if (vehicleInUse?._id) {
      navigate("arrival", {
        id: vehicleInUse._id.toString(),
      })
    } else {
      navigate("departure")
    }
  }

  function fetchHistoricInUse() {
    try {
      const vehicle = historic.filtered("status = 'departure'")[0]
      setVehicleInUse(vehicle)
    } catch (error) {
      console.log(error)
      Alert.alert("Historico", "Não foi possível carregar o histórico")
    }
  }

  function fetchHistoric() {
    try {
      const vehicles = historic.filtered(
        "status = 'arrival' SORT(created_at DESC)"
      )
      const formattedHistoric = vehicles.map((item) => {
        return {
          id: item._id!.toString(),
          licensePlate: item.license_plate,
          created: dayjs(item.created_at).format(
            "[Saída em] DD/MM/YYYY [às] HH:mm"
          ),
          isSynced: false,
        }
      })

      setHistoricList(formattedHistoric)
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

  useEffect(() => {
    fetchHistoricInUse()
  }, [])

  useEffect(() => {
    realm.addListener("change", () => fetchHistoricInUse())

    return () => {
      {
        if (realm && !realm.isClosed) {
          realm.removeListener("change", fetchHistoricInUse)
        }
      }
    }
  }, [])

  useEffect(() => {
    fetchHistoric()
  }, [historic])

  return (
    <Container>
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
