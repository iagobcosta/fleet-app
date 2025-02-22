import { TextInputProps } from "react-native"
import { Container, Input, Label } from "./styles"
import { useTheme } from "styled-components/native"

type Props = TextInputProps & {
  label: string
}

export function LicensePlateInput({ label, ...rest }: Props) {
  const { COLORS } = useTheme()
  return (
    <Container>
      <Label>{label}</Label>

      <Input maxLength={7} placeholderTextColor={COLORS.GRAY_400} {...rest} />
    </Container>
  )
}
