import { useEffect, useRef, useState } from "react"
import { TextInput, ScrollView, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Car } from "phosphor-react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import {
  useForegroundPermissions,
  watchPositionAsync,
  LocationAccuracy,
  LocationSubscription,
  LocationObjectCoords,
  requestBackgroundPermissionsAsync,
} from "expo-location"

import { useUser } from "@realm/react"
import { licensePlateValidate } from "../../utils/licensePlateValidate"
import { getAddressLocation } from "../../utils/getAddressLocation"
import { openSettings } from "../../utils/openSettings"

import { Button } from "../../components/Button"
import { Header } from "../../components/Header"
import { LicensePlateInput } from "../../components/LicensePlateInput"
import { TextAreaInput } from "../../components/TextAreaInput"
import { LocationInfo } from "../../components/LocationInfo"
import { Loading } from "../../components/Loading"
import { Map } from "../../components/Map"

import { Container, Content, Message, MessageContent } from "./styles"

import { usePowerSync } from "@powersync/react-native"
import { ObjectId } from "bson"
import { startLocationTask } from "../../tasks/backgroundLocationTask"

export function Departure() {
  const [description, setDescription] = useState("")
  const [licensePlate, setLicensePlate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [currentAddress, setCurrentAddress] = useState<string | null>(null)
  const [currentCoords, setCurrentCoords] =
    useState<LocationObjectCoords | null>(null)

  const [locationForegroundPermission, requestLocationForegroundPermission] =
    useForegroundPermissions()

  const { goBack } = useNavigation()
  const user = useUser()
  const db = usePowerSync()

  const descriptionRef = useRef<TextInput>(null)
  const licensePlateRef = useRef<TextInput>(null)

  async function handleDepartureRegister() {
    try {
      if (!licensePlateValidate(licensePlate)) {
        licensePlateRef.current?.focus()
        return Alert.alert(
          "Placa inválida",
          "A placa informada não é válida. Por favor, verifique e tente novamente."
        )
      }

      if (description.trim().length === 0) {
        descriptionRef.current?.focus()
        return Alert.alert(
          "Descrição inválida",
          "A descrição é obrigatória. Por favor, verifique e tente novamente."
        )
      }

      if (!currentCoords?.latitude && !currentCoords?.longitude) {
        return Alert.alert(
          "Localização inválida",
          "Não foi possível obter a localização do veículo. Por favor, verifique e tente novamente."
        )
      }

      setIsLoading(true)

      const backgroundPermission = await requestBackgroundPermissionsAsync()

      if (!backgroundPermission.granted) {
        setIsLoading(false)
        return Alert.alert(
          "Permissão de localização",
          "É necessário permitir o acesso à localização para registrar a saída do veículo.",
          [{ text: "Abrir configurações", onPress: openSettings }]
        )
      }

      const { rows } = await db.execute(
        "INSERT INTO Historic (id, user_id, license_plate, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
        [
          new ObjectId().toHexString(),
          user!.id,
          licensePlate.toUpperCase(),
          description,
          "departure",
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      )

      await db.execute(
        "INSERT INTO Coords (id, historic_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?, ?)",
        [
          new ObjectId().toHexString(),
          rows?._array[0].id,
          currentCoords.latitude,
          currentCoords.longitude,
          new Date().getTime(),
        ]
      )

      Alert.alert(
        "Saída registrada",
        "A saída do veículo foi registrada com sucesso."
      )
      await startLocationTask()

      setIsLoading(false)
      goBack()
    } catch (error) {
      setIsLoading(false)
      console.log(error)
      Alert.alert("Erro ao registrar saída", "Tente novamente mais tarde.")
    }
  }

  useEffect(() => {
    requestLocationForegroundPermission()
  }, [])

  useEffect(() => {
    if (!locationForegroundPermission?.granted) {
      return
    }

    let subscription: LocationSubscription
    if (locationForegroundPermission?.granted) {
      watchPositionAsync(
        {
          accuracy: LocationAccuracy.High,
          timeInterval: 1000,
        },
        (location) => {
          setCurrentCoords(location.coords)
          getAddressLocation(location.coords)
            .then((address) => {
              if (address) {
                setCurrentAddress(address)
              }
            })
            .finally(() => {
              setIsLoadingLocation(false)
            })
        }
      ).then((response) => (subscription = response))
    }

    return () => subscription?.remove()
  }, [locationForegroundPermission])

  if (!locationForegroundPermission?.granted) {
    return (
      <Container>
        <Header title="Saída" />
        <MessageContent>
          <Message>
            Você precisa permitir o acesso à localização para utilizar essa
            funcionalidade e registrar a saída. Por favor, acesse as
            configurações do seu dispositivo para permitir o acesso à
            localização.
          </Message>

          <Button title="Abrir configurações" onPress={openSettings} />
        </MessageContent>
      </Container>
    )
  }

  if (isLoadingLocation) {
    return <Loading />
  }

  return (
    <Container>
      <Header title="Saída" />
      <KeyboardAwareScrollView extraHeight={100}>
        <ScrollView>
          {currentCoords && <Map coordinates={[currentCoords]} />}
          <Content>
            {currentAddress && (
              <LocationInfo
                icon={Car}
                label="Endereço atual"
                description={currentAddress}
              />
            )}

            <LicensePlateInput
              ref={licensePlateRef}
              label="Placa do veículo"
              placeholder="ABC1234"
              onSubmitEditing={() => descriptionRef.current?.focus()}
              returnKeyType="next"
              onChangeText={setLicensePlate}
            />

            <TextAreaInput
              ref={descriptionRef}
              label="Finalidade"
              placeholder="Vou utilizar o veículo para..."
              returnKeyType="send"
              onSubmitEditing={handleDepartureRegister}
              blurOnSubmit
              onChangeText={setDescription}
            />

            <Button
              title="Registrar saída"
              onPress={handleDepartureRegister}
              isLoading={isLoading}
            />
          </Content>
        </ScrollView>
      </KeyboardAwareScrollView>
    </Container>
  )
}
