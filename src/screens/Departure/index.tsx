import { useRef, useState } from "react"
import { TextInput, ScrollView, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"

import { useUser } from "@realm/react"
import { useRealm } from "../../libs/realm"
import { Historic } from "../../libs/realm/schemas/Historic"
import { licensePlateValidate } from "../../utils/licensePlateValidate"

import { Button } from "../../components/Button"
import { Header } from "../../components/Header"
import { LicensePlateInput } from "../../components/LicensePlateInput"
import { TextAreaInput } from "../../components/TextAreaInput"

import { Container, Content } from "./styles"

export function Departure() {
  const [description, setDescription] = useState("")
  const [licensePlate, setLicensePlate] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { goBack } = useNavigation()
  const realm = useRealm()
  const user = useUser()

  const descriptionRef = useRef<TextInput>(null)
  const licensePlateRef = useRef<TextInput>(null)

  function handleDepartureRegister() {
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
      setIsLoading(true)

      realm.write(() => {
        realm.create(
          "Historic",
          Historic.generate({
            user_id: user!.id,
            license_plate: licensePlate.toUpperCase(),
            description,
          })
        )
      })

      Alert.alert(
        "Saída registrada",
        "A saída do veículo foi registrada com sucesso."
      )

      setIsLoading(false)
      goBack()
    } catch (error) {
      setIsLoading(false)
      console.log(error)
      Alert.alert("Erro ao registrar saída", "Tente novamente mais tarde.")
    }
  }

  return (
    <Container>
      <Header title="Saída" />
      <KeyboardAwareScrollView extraHeight={100}>
        <ScrollView>
          <Content>
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
