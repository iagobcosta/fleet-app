import { Alert } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { X } from "phosphor-react-native"
import { usePowerSync } from "@powersync/react-native"
import dayjs from "dayjs"
import { LatLng } from "react-native-maps"
import { ObjectId } from "bson"

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
import { Historic } from "../../libs/powerSync/Historic"
import { useEffect, useState } from "react"
import { Loading } from "../../components/Loading"
import { Locations } from "../../components/Locations"
import { LocationInfoProps } from "../../components/LocationInfo"

import { getLastAsyncTimestamp } from "../../libs/asyncStorage/syncStorage"
import { stopLocationTask } from "../../tasks/backgroundLocationTask"
import {
  getStorageLocations,
  LocationProps,
} from "../../libs/asyncStorage/locationStorage"
import { Map } from "../../components/Map"
import { getAddressLocation } from "../../utils/getAddressLocation"
import { LoadingIndicator } from "../../components/Loading/styles"

type RouteParamsProps = {
  id: string
}

export function Arrival() {
  const route = useRoute()
  const { id } = route.params as RouteParamsProps
  const { goBack } = useNavigation()
  const [dataNotSynced, setDataNotSynced] = useState(false)
  const [title, setTitle] = useState("")
  // const [coordinates, setCoordinates] = useState<LatLng[]>([])
  const [coordinates, setCoordinates] = useState<LocationProps[]>([])

  const [isLoadingHistoric, setIsLoadingHistoric] = useState(true)
  const [historic, setHistoric] = useState<Historic | null>(null)

  const [departure, setDeparture] = useState<LocationInfoProps>(
    {} as LocationInfoProps
  )
  const [arrival, setArrival] = useState<LocationInfoProps | null>(null)

  const [isLoading, setIsLoading] = useState(true)

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
    await db.execute("DELETE FROM Coords WHERE historic_id = ?", [id])
    await db.execute("DELETE FROM Historic WHERE id = ?", [id])
    await stopLocationTask()
    goBack()
  }

  async function saveCoords(item: LocationProps) {
    await db.execute(
      "INSERT INTO Coords (id, historic_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?, ?)",
      [
        new ObjectId().toHexString(),
        id,
        item.latitude,
        item.longitude,
        new Date().getTime(),
      ]
    )
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

      const locations = await getStorageLocations()

      locations.forEach((item: LocationProps) => {
        saveCoords(item)
      })

      await stopLocationTask()

      Alert.alert("Sucesso", "Chegada registrada com sucesso")

      goBack()
    } catch (error) {
      console.log(error)
      Alert.alert("Erro", "Não foi possível registrar a chegada")
    }
  }

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

  async function getCoordinates() {
    try {
      await db
        .getAll("SELECT * FROM Coords WHERE historic_id = ?", [historic?.id])
        .then((result) => {
          setCoordinates(result as any)
        })
    } catch (error) {
      console.log("Error in getCoordinates", error)
    }
  }

  async function getLocationInfo() {
    if (!historic) return
    const title = historic?.status === "departure" ? "Chegada" : "Detalhes"
    setTitle(title)

    const lastSync = await getLastAsyncTimestamp()
    const updatedAt = dayjs(historic?.updated_at!)
    setDataNotSynced(updatedAt.isAfter(lastSync))

    if (historic?.status === "departure") {
      const locationsStorage = await getStorageLocations()
      setCoordinates(locationsStorage)
    } else {
      await getCoordinates()
    }
  }

  async function getHistoricPositions(historic: any) {
    try {
      if (coordinates.length > 0) {
        const firstLocation = coordinates[0]
        console.log(firstLocation)
        const departureStreetName = await getAddressLocation(firstLocation)
        setDeparture({
          label: `Saindo em ${departureStreetName ?? ""}`,
          description: dayjs(
            new Date(Number(coordinates[0]?.timestamp))
          ).format("DD/MM/YYYY [às] HH:mm"),
        })
      }

      if (historic.status === "arrival") {
        const lastLocation = coordinates[coordinates.length - 1]
        const arrivalStreetName = await getAddressLocation(lastLocation)

        setArrival({
          label: `Chagando em ${arrivalStreetName ?? ""}`,
          description: dayjs(new Date(Number(lastLocation?.timestamp))).format(
            "DD/MM/YYYY [às] HH:mm"
          ),
        })
      }
    } catch (error) {
      console.log("Erro ao carregar as informacoes do historico", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (historic !== null) {
      getHistoricPositions(historic)
    }
  }, [coordinates])

  useEffect(() => {
    if (historic === null) {
      getHistoricById(id)
    }
  }, [historic])

  useEffect(() => {
    getLocationInfo()
  }, [historic])

  if (isLoadingHistoric) {
    return <Loading />
  }

  return (
    <Container>
      <Header title={title} />

      {coordinates.length > 0 && <Map coordinates={coordinates} />}

      <Content>
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <Locations departure={departure} arrival={arrival} />
        )}

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
