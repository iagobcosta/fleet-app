import { useState } from "react"
import { Container, Title, Slogan } from "./styles"

import { GoogleSignin } from "@react-native-google-signin/google-signin"

import { Realm, useApp } from "@realm/react"

import BackgroundImg from "../../assets/background.png"
import { Button } from "../../components/Button"

import { WEB_CLIENT_ID, IOS_CLIENT_ID } from "@env"
import { Alert } from "react-native"

GoogleSignin.configure({
  scopes: ["email", "profile"],
  webClientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
})

export function SignIn() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const app = useApp()

  async function handleGoogleSignIn() {
    try {
      setIsAuthenticating(true)
      const { data } = await GoogleSignin.signIn()

      if (data?.idToken) {
        const credentials = Realm.Credentials.jwt(data.idToken)

        await app.logIn(credentials)
      } else {
        Alert.alert("Entrar", "Não foi possível realizar o login com o google")
      }
    } catch (error) {
      Alert.alert(
        "Entrar",
        "Não foi possível realizar o login com o google" + error
      )
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <Container source={BackgroundImg}>
      <Title>Fleet App</Title>
      <Slogan>Gestão de veículos</Slogan>
      <Button
        title="Entrar com google"
        isLoading={isAuthenticating}
        onPress={handleGoogleSignIn}
      />
    </Container>
  )
}
