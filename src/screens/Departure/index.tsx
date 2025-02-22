import { useRef } from "react"
import { TextInput, ScrollView, Platform } from "react-native"

import { Button } from "../../components/Button"
import { Header } from "../../components/Header"
import { LicensePlateInput } from "../../components/LicensePlateInput"
import { TextAreaInput } from "../../components/TextAreaInput"

import { Container, Content } from "./styles"
import { KeyboardAvoidingView } from "react-native"

const KEYBOARD_AVOIDING_VIEW_BEHAVIOR =
  Platform.OS === "ios" ? "position" : "height"

export function Departure() {
  const descriptionRef = useRef<TextInput>(null)

  function handleDepartureRegister() {
    console.log("Departure registered")
  }

  return (
    <Container>
      <Header title="Saída" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={KEYBOARD_AVOIDING_VIEW_BEHAVIOR}
      >
        <ScrollView>
          <Content>
            <LicensePlateInput
              label="Placa do veículo"
              placeholder="ABC1234"
              onSubmitEditing={() => descriptionRef.current?.focus()}
              returnKeyType="next"
            />

            <TextAreaInput
              ref={descriptionRef}
              label="Finalidade"
              placeholder="Vou utilizar o veículo para..."
              returnKeyType="send"
              onSubmitEditing={handleDepartureRegister}
              blurOnSubmit
            />

            <Button title="Registrar saída" onPress={handleDepartureRegister} />
          </Content>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  )
}
