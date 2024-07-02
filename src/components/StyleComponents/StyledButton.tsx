import styled, { ThemedStyledProps } from "styled-components"

interface IStyledButtonProps extends ThemedStyledProps<any, any> {
  dim?: boolean
}

export const StyledButton = styled.button<IStyledButtonProps>`
  position: absolute;
  top: 0.7em;
  right: 2em;
  background: none;
  border: none;
  cursor: pointer;
  color: white;
`

export const StyledCloseButton = styled.button<IStyledButtonProps>`
  position: absolute;
  top: 0.4em;
  left: 1em;
  background: none;
  border: none;
  box-shadow: none;
  cursor: pointer;
  color: white;
  font-size: 2em;
`
