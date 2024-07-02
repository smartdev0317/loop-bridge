import styled, { ThemedStyledProps } from "styled-components"
import { FlexRow } from "components/StyleComponents/FlexRow"
import screenConfigs from "config/screenConfigs"

interface IStyledChainSelectorProps extends ThemedStyledProps<any, any> {
  animate: boolean
}

export const StyledChainSelectionComponent = styled(
  FlexRow
) <IStyledChainSelectorProps>`
  position: relative;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 10px;
  background-origin: border-box;
  background-clip: content-box, border-box;
  white-space: nowrap;
  width: 100%;

  // @media ${screenConfigs.media.desktop} {
  //   padding: 10px 15px 15px 15px;
  // }
  // @media ${screenConfigs.media.laptop} {
  //   padding: 5px 10px 15px 10px;
  // }
  // @media ${screenConfigs.media.tablet} {
  //   padding: 5px 5px 10px 5px;
  // }
  // @media ${screenConfigs.media.mobile} {
  //   padding: 5px 5px 10px 5px;
  // }
`
