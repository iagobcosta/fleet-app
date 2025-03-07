import { useNavigation, useRoute } from "@react-navigation/native"
import { X } from "phosphor-react-native"
import { usePowerSync, useQuery } from "@powersync/react-native"
import dayjs from "dayjs"

import { Header } from "../../components/Header"
import { Button } from "../../components/Button"
import { ButtonIcon } from "../../components/ButtonIcon"

import {
  AsyncMessage,
  Container,
  Content,
  Description,
  Footer,
  Label,
  LicensePlate,
} from "./styles"
import { Alert } from "react-native"
import { Historic } from "../../libs/powerSync/Historic"
import { useEffect, useState } from "react"
import { getLastAsyncTimestamp } from "../../libs/asyncStorage/syncStorage"
import { Loading } from "../../components/Loading"
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry"

type RouteParamsProps = {
  id: string
}

export function Arrival() {
  const route = useRoute()
  const { id } = route.params as RouteParamsProps
  const { goBack } = useNavigation()
  const [dataNotSynced, setDataNotSynced] = useState(false)
  const [title, setTitle] = useState("")

  const [isLoadingHistoric, setIsLoadingHistoric] = useState(true)
  const [historic, setHistoric] = useState<Historic | null>(null)

  const db = usePowerSync()

  function handleRemoveVehicleUsage() {
    Alert.alert("Cancelar", "Deseja realmente cancelar o uso do veículo?", [
      {
        text: "Não",
        style: "cancel",
      },
      {
        text: "Sim",
        onPress: () => removeVehicleUsage(),
      },
    ])
  }

  async function removeVehicleUsage() {
    await db.execute("DELETE FROM Historic WHERE id = ?", [id])

    goBack()
  }

  async function handleArrivalRegister() {
    try {
      if (!historic) {
        Alert.alert(
          "Erro",
          "Não foi possível obter os registros do veículo para registrar a chegada"
        )
      }

      await db.execute(
        "UPDATE Historic SET status = ?, updated_at = ? WHERE id = ?",
        ["arrival", new Date().toISOString(), id]
      )

      Alert.alert("Sucesso", "Chegada registrada com sucesso")

      goBack()
    } catch (error) {
      console.log(error)
      Alert.alert("Erro", "Não foi possível registrar a chegada")
    }
  }

  useEffect(() => {
    if (historic === null) {
      getHistoricById(id)
    }
  }, [historic])

  async function getHistoricById(id: string) {
    await db
      .get("SELECT * FROM Historic WHERE id = ?", [id])
      .then((result) => {
        setHistoric(result as Historic)
      })
      .finally(() => {
        setIsLoadingHistoric(false)
      })
  }

  useEffect(() => {
    if (!historic) return
    const title = historic?.status === "departure" ? "Chegada" : "Detalhes"
    setTitle(title)
    getLastAsyncTimestamp().then((lastSync) => {
      setDataNotSynced(dayjs(historic!.updated_at!).isAfter(lastSync))
    })
  }, [historic])

  if (isLoadingHistoric) {
    return <Loading />
  }

  return (
    <Container>
      <Header title={title} />

      <Content>
        <Label>Placa do veículo</Label>
        <LicensePlate>{historic?.license_plate}</LicensePlate>

        <Label>Descrição:</Label>
        <Description>{historic?.description}</Description>
      </Content>
      {historic?.status === "departure" && (
        <Footer>
          <ButtonIcon icon={X} onPress={handleRemoveVehicleUsage} />
          <Button title="Registar chegada" onPress={handleArrivalRegister} />
        </Footer>
      )}

      {dataNotSynced && (
        <AsyncMessage>
          Sincronização da{" "}
          {historic?.status === "departure" ? "partida" : "chegada"} pendente
        </AsyncMessage>
      )}
    </Container>
  )
}
