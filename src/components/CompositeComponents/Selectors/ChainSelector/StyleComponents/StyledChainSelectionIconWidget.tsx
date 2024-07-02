import styled, { ThemedStyledProps } from "styled-components"

interface IStyledChainSelectionIconWidgetProps
  extends ThemedStyledProps<any, any> {
  hide: boolean
}

export const StyledChainSelectionIconWidget = styled.div<IStyledChainSelectionIconWidgetProps>`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  visibility: ${(props) => (props.hide ? "hidden" : "visible")};
  transition: 1000ms;
  background: #2e2e2e;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
`

export const ActiveStyledChainSelectionIconWidget = styled.div<IStyledChainSelectionIconWidgetProps>`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  visibility: ${(props) => (props.hide ? "hidden" : "visible")};
  transition: 1000ms;
  background: #2e2e2e;
  border-radius: 10px 10px 0px 0px;
  padding: 10px;
  cursor: pointer;
`

export const StyledAssetSelectionIconWidget = styled.div<IStyledChainSelectionIconWidgetProps>`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  visibility: ${(props) => (props.hide ? "hidden" : "visible")};
  transition: 1000ms;
  border-bottom: 1px solid #2e2e2e;
  padding: 5px 10px 5px 10px;
  cursor: pointer;
`
