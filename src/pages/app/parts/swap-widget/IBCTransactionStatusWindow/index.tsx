import styled, { ThemedStyledProps } from "styled-components"
import screenConfigs from "config/screenConfigs"
import { opacityAnimation } from "components/StyleComponents/animations/OpacityAnimation"
import { FlexRow } from "components/StyleComponents/FlexRow"
import { StyledCloseButton } from "components/StyleComponents/StyledButton"
import { useRecoilValue } from "recoil"
import { ChainSelection } from "state/ChainSelection"
import { ROUTE_TOKEN_KEY, SOURCE_TOKEN_KEY } from "config/consts"
import { RouteChainDepositTxHash, RouteChainDepositTxResult, SrcChainDepositTxHash, SrcChainDepositTxResult } from "state/TransactionStatus"
import { useState } from "react"
import { SelectedChainLogoAndText } from "components/CompositeComponents/Selectors/ChainSelector/SelectedChainLogoAndText"
import UTIL from "utils/util"

interface ITransactionStatusWindowProps {
  isOpen: boolean
  closeResultsScreen: any
}

const StyledTransactionStatusWindow = styled.div`
  ${opacityAnimation}
  position: relative;
  overflow: hidden;
  margin-bottom: 5px;

  @media ${screenConfigs.media.desktop} {
    width: 100%;
    margin-bottom: 5px;
    margin-top: 50px;
  }
  @media ${screenConfigs.media.laptop} {
    width: 100%;
    margin-bottom: 20px;
  }
  @media ${screenConfigs.media.tablet} {
    width: 100%;
    margin-bottom: 5px;
  }
  @media ${screenConfigs.media.mobile} {
    width: 100%;
    margin-bottom: 5px;
  }
`

const IBCTransactionStatusWindow = ({
  isOpen,
  closeResultsScreen,
}: ITransactionStatusWindowProps) => {

  const [sentSuccess, setSentSuccess] = useState(false)

  const sourceChainSelection = useRecoilValue(ChainSelection(SOURCE_TOKEN_KEY))
  const routeChainSelection = useRecoilValue(ChainSelection(ROUTE_TOKEN_KEY))
  const sourceChainTxResult = useRecoilValue(SrcChainDepositTxResult)
  const routeChainTxResult = useRecoilValue(RouteChainDepositTxResult)
  const sourceTxHash = useRecoilValue(SrcChainDepositTxHash)
  const routeTxHash = useRecoilValue(RouteChainDepositTxHash)

  const getUrl = (chain: any, txHash: any) => {
    const chainName = chain?.chainName?.toLowerCase()
    if (chainName === 'cosmoshub') return `https://www.mintscan.io/cosmos/txs/${txHash}`
    else return `https://www.mintscan.io/${chainName}/txs/${txHash}`
  }

  return (
    <StyledTransactionStatusWindow>
      <StyledCloseButton onClick={closeResultsScreen}>
        <i className="fa fa-angle-left"></i>
      </StyledCloseButton>
      <FlexRow
        style={{
          color: "white"
        }}
      >
        <h2>Tx Result</h2>
      </FlexRow>
      <br />
      <br />
      <FlexRow
        style={{
          color: "white",
          justifyContent: "space-between",
          width: "100%"
        }}
      >
        <SelectedChainLogoAndText chainInfo={sourceChainSelection} />
        <div>
          <a style={{ marginLeft: "0.5em", color: "white", fontSize: `1em` }} href={getUrl(sourceChainSelection, sourceTxHash)}>{UTIL.truncate(sourceTxHash || "", [10, 10])}</a>
          {
            sourceChainTxResult?.code === 0 ?
              <i style={{ color: "lime", marginLeft: "5px" }} className="fa fa-check" /> :
              <i style={{ color: "red", marginLeft: "5px" }} className="fa fa-times" />
          }
        </div>
      </FlexRow>
      {
        routeTxHash &&
        <>
          <br />
          <FlexRow
            style={{
              color: "white",
              justifyContent: "space-between",
              width: "100%"
            }}
          >
            <SelectedChainLogoAndText chainInfo={routeChainSelection} />
            <div>
              <a style={{ marginLeft: "0.5em", color: "white", fontSize: `1em` }} href={getUrl(routeChainSelection, routeTxHash)}>{UTIL.truncate(routeTxHash || "", [10, 10])}</a>
              {
                routeChainTxResult?.code === 0 ?
                  <i style={{ color: "lime", marginLeft: "5px" }} className="fa fa-check" /> :
                  <i style={{ color: "red", marginLeft: "5px" }} className="fa fa-times" />
              }
            </div>
          </FlexRow>
        </>
      }
    </StyledTransactionStatusWindow>
  )
}

export default IBCTransactionStatusWindow
