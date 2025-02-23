import { useNavigation, useRoute } from "@react-navigation/native"
import { X } from "phosphor-react-native"

import { useObject, useRealm } from "../../libs/realm"
import { Realm } from "@realm/react"
import { Historic } from "../../libs/realm/schemas/Historic"

import { Header } from "../../components/Header"
import { Button } from "../../components/Button"
import { ButtonIcon } from "../../components/ButtonIcon"

import {
  Container,
  Content,
  Description,
  Footer,
  Label,
  LicensePlate,
} from "./styles"
import { Alert } from "react-native"

type RouteParamsProps = {
  id: string
}

export function Arrival() {
  const route = useRoute()
  const { id } = route.params as RouteParamsProps
  const { goBack } = useNavigation()

  const historic = useObject(Historic, new Realm.BSON.UUID(id) as any)
  const realm = useRealm()

  const title = historic?.status === "departure" ? "Chegada" : "Detalhes"

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

  function removeVehicleUsage() {
    if (historic) {
      realm.write(() => {
        realm.delete(historic)
      })
    }

    goBack()
  }

  function handleArrivalRegister() {
    try {
      if (!historic) {
        Alert.alert(
          "Erro",
          "Não foi possível obter os registros do veículo para registrar a chegada"
        )
      }

      realm.write(() => {
        historic!.status = "arrival"
        historic!.updated_at = new Date()
      })

      Alert.alert("Sucesso", "Chegada registrada com sucesso")

      goBack()
    } catch (error) {
      console.log(error)
      Alert.alert("Erro", "Não foi possível registrar a chegada")
    }
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
        // <>
        //   <Label>Tempo de uso:</Label>
        //   <Description>
        //     {dayjs(historic.updated_at).fromNow()}
        //   </Description>
        // </>
        <Footer>
          <ButtonIcon icon={X} onPress={handleRemoveVehicleUsage} />
          <Button title="Registar chegada" onPress={handleArrivalRegister} />
        </Footer>
      )}
    </Container>
  )
}
