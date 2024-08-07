import { ReactElement } from "react"
import styled from "styled-components"

export const StyledBaseSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-left: 5px;
  margin-right: 5px;
  font-weight: bold;
  color: #fff;
`

interface IBaseSelectorProps {
  image: ReactElement
  label: string | ReactElement
}

export const BaseSelector = (props: IBaseSelectorProps) => {
  return (
    <StyledBaseSelector>
      {props.image}
      <div style={props.image ? { marginLeft: `10px` } : { fontWeight: 'normal', color: "#898994" }}>{props.label}</div>
    </StyledBaseSelector>
  )
}
