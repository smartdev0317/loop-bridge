import React, { ReactElement } from "react"
import { CSSTransition, SwitchTransition } from "react-transition-group"
import { useRecoilValue } from "recoil"
// import styled, { ThemedStyledProps } from "styled-components"
import styled from "styled-components"
// import { DESTINATION_TOKEN_KEY, SOURCE_TOKEN_KEY } from "config/consts"
import screenConfigs from "config/screenConfigs"
import { animateStyles } from "components/StyleComponents/animations/SwitchToggleAnimation"
import { StyledCentered } from "components/StyleComponents/Centered"
import usePostTransactionToBridge from "hooks/usePostTransactionToBridge"
import usePostTransactionToIBCBridge from "hooks/usePostTransactionToIBCBridge"
// import {
//   ChainSelection,
//   IsValidDestinationAddress,
//   SourceAsset,
// } from "state/ChainSelection"
import UserInputWindow from "./UserInputWindow"
import TransactionStatusWindow from "./TransactionStatusWindow"
import IBCTransactionStatusWindow from "./IBCTransactionStatusWindow"
import SendIBCTransactionWindow from "./SendIBCTransactionWindow"
import { SupportWidget } from "../support-widget"
import { IBCTokenSelectedState } from "state/Others"
import { ShowIBCTransactionStatusWindow, ShowSendIBCTransactionWindow, ShowSendTransactionWindow } from "state/ApplicationStatus"

// interface IStyledImageProps extends ThemedStyledProps<any, any> {
//   showContents?: boolean
// }

// const StyledImage = styled.img<IStyledImageProps>`
//   position: absolute;
//   opacity: ${(props) => (props.showContents ? "1" : "0")};
//   ${(props) =>
//     props.showContents
//       ? `transition: opacity 500ms ease-in;`
//       : `transition: opacity 500ms ease-out; transition-delay: 500ms;`}

//   @media ${screenConfigs.media.desktop} {
//     width: 2048px;
//     height: 869px;
//   }
//   @media ${screenConfigs.media.laptop} {
//     width: 1900px;
//     height: 700px;
//   }
//   @media ${screenConfigs.media.tablet} {
//     width: 1256px;
//     height: 533px;
//   }
//   @media ${screenConfigs.media.mobile} {
//     width: 0px;
//     height: 0px;
//   }
// `

const StyledSwapWindow = styled.div`
  ${StyledCentered}
  ${animateStyles}
    position: relative;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  background: #1b1b1b;
  @media ${screenConfigs.media.desktop} {
    padding: 30px 60px 50px;
  }
  @media ${screenConfigs.media.laptop} {
    padding: 30px 60px 50px;
  }
  @media ${screenConfigs.media.tablet} {
    padding: 30px 60px 50px;
  }
  @media ${screenConfigs.media.mobile} {
    padding: 38px 24px 20px;
  }
  border-radius: 2em;
`

const StyledContainer = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`

const SwapWindow = (): ReactElement => {
  const [
    showTransactionStatusWindow,
    handleTransactionSubmission,
    closeResultsScreen,
  ] = usePostTransactionToBridge()
  const showIBCTransactionStatusWindow = useRecoilValue(ShowIBCTransactionStatusWindow)
  const showSendTransactionWindow = useRecoilValue(ShowSendTransactionWindow)
  const showSendIBCTransactionWindow = useRecoilValue(ShowSendIBCTransactionWindow)

  const [handleIBCTransactionSubmission] = usePostTransactionToIBCBridge()

  const userInputNeeded = !showSendTransactionWindow && !showSendIBCTransactionWindow && !showTransactionStatusWindow && !showIBCTransactionStatusWindow

  // const sourceChainSelection = useRecoilValue(ChainSelection(SOURCE_TOKEN_KEY))
  // const destChainSelection = useRecoilValue(
  //   ChainSelection(DESTINATION_TOKEN_KEY)
  // )
  // const selectedSourceAsset = useRecoilValue(SourceAsset)
  // const isValidDestinationAddr = useRecoilValue(IsValidDestinationAddress)
  const isIBCTokenSelected = useRecoilValue(IBCTokenSelectedState)

  // const canLightUp =
  //   sourceChainSelection &&
  //   destChainSelection &&
  //   sourceChainSelection.chainName !== destChainSelection.chainName &&
  //   selectedSourceAsset &&
  //   isValidDestinationAddr

  const handleUserSubmit = async () => {
    if (isIBCTokenSelected) return handleIBCTransactionSubmission()
    return await handleTransactionSubmission()
  }

  return (
    <StyledSwapWindow>
      {/* <SwitchTransition mode={"out-in"}>
        <CSSTransition
          key={
            userInputNeeded ? "user-input-window" : "transaction-status-window"
          }
          addEndListener={(node, done) =>
            node.addEventListener("transitionend", done, false)
          }
          classNames="fade"
        > */}
      {/* <div style={{ position: `relative` }}> */}
      <StyledContainer>
        {userInputNeeded ? (
          <UserInputWindow
            handleTransactionSubmission={handleUserSubmit}
          />
        ) : (showSendIBCTransactionWindow ? (
          <SendIBCTransactionWindow
            isOpen={showSendIBCTransactionWindow}
            closeResultsScreen={closeResultsScreen}
          />
        ) : (showTransactionStatusWindow ? (
          <TransactionStatusWindow
            isOpen={showTransactionStatusWindow}
            closeResultsScreen={closeResultsScreen}
          />
        ) : (
          <IBCTransactionStatusWindow
            isOpen={showIBCTransactionStatusWindow}
            closeResultsScreen={closeResultsScreen}
          />
        )))}
      </StyledContainer>
      {/* </div> */}
      {/* </CSSTransition>
      </SwitchTransition>
      <SupportWidget /> */}
    </StyledSwapWindow>
  )
}

export default SwapWindow
