import styled from "styled-components"
import screenConfigs from "config/screenConfigs"
import { useRecoilValue } from "recoil"
import { AssetInfo, ChainInfo, DESTINATION_TOKEN_KEY, ROUTE_TOKEN_KEY, SOURCE_TOKEN_KEY } from "config/consts"
import downstreamServices from "config/downstreamServices"
import CopyToClipboard from "components/Widgets/CopyToClipboard"
import Link from "components/Widgets/Link"
import BoldSpan from "components/StyleComponents/BoldSpan"
import { FlexRow } from "components/StyleComponents/FlexRow"
import { ImprovedTooltip } from "components/Widgets/ImprovedTooltip"
import { SVGImage } from "components/Widgets/SVGImage"
import {
  ChainSelection,
  SourceAsset,
} from "state/ChainSelection"
import {
  SourceDepositAddress,
  SrcChainDepositTxHash,
  RouteChainDepositTxHash,
} from "state/TransactionStatus"
import { getShortenedWord } from "utils/wordShortener"
import logoKeplr from "assets/svg/keplr.svg"
import { WalletType } from "state/Wallet"
import { getConfigs } from "api/WaitService"
import { ListItem } from "./ListItem"
import { useEffect, useState } from "react"
import { DepositFromWallet } from "./DepositFromWallet"

const StyledStatusList = styled.div`
  width: 100%;
  height: 65%;
  @media ${screenConfigs.media.desktop} {
    margin-top: 20px;
  }
`
const StyledSVGImage = styled(SVGImage)`
  cursor: pointer;
`
const HelperWidget = styled.span`
  box-sizing: border-box;
  padding: 0.5em 1em 0.5em 1em;
  text-align: center;
  background-color: ${(props) => props.theme.headerBackgroundColor};
  border-radius: 50px;
  color: white;
  cursor: pointer;
  font-size: smaller;
  transition: opacity 0.2s ease;
  min-width: fit-content;
  &:hover {
    opacity: 0.8;
  }
`

interface IStatusListProps {
  activeStep: number
  isWalletConnected: boolean
  connectToWallet: (walletType: WalletType) => void
  walletBalance: number
  reloadBalance: () => void
  walletAddress: string
}

const StatusList = (props: IStatusListProps) => {
  const { activeStep } = props
  const selectedSourceAsset = useRecoilValue(SourceAsset)
  const sourceChain = useRecoilValue(ChainSelection(SOURCE_TOKEN_KEY))
  const routeChain = useRecoilValue(ChainSelection(ROUTE_TOKEN_KEY))
  const destinationChain = useRecoilValue(ChainSelection(DESTINATION_TOKEN_KEY))
  const depositAddress = useRecoilValue(SourceDepositAddress)
  const [tokenToAdd, setTokenToAdd] = useState(false)
  const srcChainDepositHash = useRecoilValue(SrcChainDepositTxHash)
  const routeChainDepositHash = useRecoilValue(RouteChainDepositTxHash)

  useEffect(() => {
    if (tokenToAdd) {
      setTimeout(() => {
        addTokenToMetamask(destinationChain, selectedSourceAsset)
        setTokenToAdd(false)
      }, 2000)
    }
  }, [tokenToAdd, destinationChain, selectedSourceAsset])

  const renderWalletButton = () => {
    const logo = logoKeplr
    const walletName = "Keplr"
    const walletType = WalletType.KEPLR
    return (
      <div>
        <FlexRow
          style={{
            width: `100%`,
            justifyContent: `flex-start`,
            marginTop: `0.5em`,
          }}
        >
          <div style={{ marginRight: `5px` }}>
            Send IBC transfer here via:
          </div>
          <HelperWidget onClick={() => props.connectToWallet(walletType)}>
            <WalletLogo src={logo} />
            <span style={{ marginLeft: "0.5em" }}>{walletName}</span>
          </HelperWidget>
        </FlexRow>
      </div>
    )
  }

  return (
    <StyledStatusList>
      <ListItem
        className={"joyride-status-step-2"}
        step={1}
        activeStep={activeStep}
        text={
          activeStep >= 1 ? (
            <div
              style={{
                overflowWrap: `break-word`,
                overflow: `hidden`,
                width: `100%`,
              }}
            >
              {srcChainDepositHash &&
                linkToExplorer(
                  sourceChain as ChainInfo,
                  srcChainDepositHash as string
                )}
              {routeChainDepositHash &&
                linkToExplorer(
                  routeChain as ChainInfo,
                  routeChainDepositHash as string
                )}
              {activeStep === 2 && (
                <DepositFromWallet
                  isWalletConnected={props.isWalletConnected}
                  walletBalance={props.walletBalance}
                  reloadBalance={props.reloadBalance}
                  walletAddress={props.walletAddress}
                  depositAddress={depositAddress as AssetInfo}
                />
              )}
              {activeStep === 1 && renderWalletButton()}
            </div>
          ) : (
            `Waiting for your deposit into the deposit account.`
          )
        }
      />
      <ListItem
        className={"joyride-status-step-3"}
        step={3}
        activeStep={activeStep}
        text={
          activeStep >= 3 ? (
            <FlexRow style={{ width: `100%`, justifyContent: `space-between` }}>
              <div>
                Transaction Complete!
              </div>
            </FlexRow>
          ) : (
            `Finalizing your transaction on ${destinationChain?.chainName}.`
          )
        }
      />
    </StyledStatusList>
  )
}

const WalletLogo = ({
  src,
  onClick,
  height,
  width,
  margin,
}: {
  src: any
  onClick?: any
  height?: string
  width?: string
  margin?: string
}) => (
  <span onClick={onClick}>
    <StyledSVGImage
      height={height || `1em`}
      width={width || `1em`}
      margin={margin || `0em 0em -0.125em 0em`}
      src={src}
    />
  </span>
)

const addTokenToMetamask = async (
  destinationChain: ChainInfo | null,
  selectedSourceAsset: AssetInfo | null
) => {
  try {
    return await (window as any).ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: getTokenAddress(
            destinationChain as ChainInfo,
            selectedSourceAsset as AssetInfo
          ),
          symbol: selectedSourceAsset?.assetSymbol,
          decimals: selectedSourceAsset?.decimals,
          image: "",
        },
      },
    })
  } catch (error) {
    console.log(error)
  }
}

const linkToExplorer = (sourceChainSelection: ChainInfo, txHash: string) => {
  const blockExplorer = getBlockExplorer(sourceChainSelection)

  return txHash ? (
    <FlexRow style={{ justifyContent: `space-between` }}>
      <span>
        {sourceChainSelection.chainName}{" "}TX:{" "}
        <BoldSpan style={{ marginRight: `5px` }}>
          {getShortenedWord(txHash)}
        </BoldSpan>
        <ImprovedTooltip
          anchorContent={
            <CopyToClipboard
              JSXToShow={<span></span>}
              height={`12px`}
              width={`10px`}
              textToCopy={txHash}
              showImage={true}
            />
          }
          tooltipText={"Copy TX hash"}
          tooltipAltText={"Copied!"}
        />
      </span>
      {blockExplorer && (
        <ImprovedTooltip
          anchorContent={
            <Link
              href={`${blockExplorer.url}${blockExplorer?.url?.includes("mintscan") ? "txs/" : "tx/"
                }${txHash}`}
            >
              <SVGImage
                style={{ marginLeft: `5px` }}
                src={
                  require(`assets/svg/logos/${sourceChainSelection.chainSymbol}.svg`)
                    .default
                }
                height={`1.5em`}
                width={`1.5em`}
                margin={`0.5em`}
              />
            </Link>
          }
          tooltipText={`View deposit transaction on ${getBlockExplorer(sourceChainSelection as ChainInfo)?.name
            }`}
          tooltipAltText={""}
        />
      )}
    </FlexRow>
  ) : null
}

const getBlockExplorer = (
  chain: ChainInfo
): { name: string; url: string } | null => {
  return (
    downstreamServices.blockExplorers[process.env.REACT_APP_STAGE as string] &&
    downstreamServices.blockExplorers[process.env.REACT_APP_STAGE as string][
    chain?.chainName?.toLowerCase() as string
    ]
  )
}

const getTokenAddress = (destinationChain: ChainInfo, asset: AssetInfo) => {
  const config = getConfigs(process.env.REACT_APP_STAGE as string)
  const tokenAddressMap =
    config?.ethersJsConfigs[destinationChain?.chainName.toLowerCase()]
      ?.tokenAddressMap
  return tokenAddressMap[asset?.common_key as string]
}

export default StatusList
