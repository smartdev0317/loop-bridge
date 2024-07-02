import { useEffect, useState } from "react"
import styled from "styled-components"
import { KeplrWallet } from "hooks/wallet/KeplrWallet"
import Container from "../StyleComponents/Container"
import { FlexRow } from "../StyleComponents/FlexRow"
import { SVGImage } from "../Widgets/SVGImage"
// import BoldSpan from "../StyleComponents/BoldSpan"
import { confirm } from "react-confirm-box"
import { StyledButton } from "components/StyleComponents/StyledButton"
// import { MetaMaskWallet } from "hooks/wallet/MetaMaskWallet"
import {
  // useConnectedWallet,
  // useLCDClient,
  // useWallet,
  // WalletLCDClientConfig,
} from "@terra-money/wallet-provider"
// import {
//   terraConfigMainnet,
//   terraConfigTestnet,
//   TerraWallet,
// } from "hooks/wallet/TerraWallet"
import { FlexColumn } from "components/StyleComponents/FlexColumn"
import { useRecoilState } from "recoil"
import { IsKeplrWalletConnected } from "state/Wallet"
import logLoop from "assets/png/log-loop.png"

const StyledPageHeader = styled(Container)`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 50px;
  padding-bottom: 10px;
`
const HeaderText = styled.div`
  display: flex;
  flex-direction: row;
  color: lightgrey;
  font-size: larger;
  box-sizing: border-box;
`
// const HeaderImage = styled.div`
//   font-family: EthnocentricRg-Regular;
//   color: lightgrey;
//   font-size: 24px;
//   box-sizing: border-box;
//   padding: 10px;
// `
// const ByText = styled.span`
//   color: lightgrey;
//   font-size: 12px;
//   box-sizing: border-box;
//   display: flex;
//   align-items: flex-end;
//   padding-bottom: 10px;
// `

const ConnectWallet = styled.div`
  display: flex;
  -webkit-box-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  align-items: center;
  text-transform: uppercase;
  background-color: #bf20ab;
  border-radius: 6px;
  color: rgb(27, 27, 27);
  font-size: 13px;
  font-weight: 600;
  height: 35px;
  padding: 0px 10px;
  border: none;
  cursor: pointer;
`
const StyledConnectWalletButton = styled(FlexRow)`
  cursor: pointer;
  transition: opacity 0.15s ease-in;
  &:hover {
    opacity: 0.7;
  }
`

const StyledDialogBox = styled.div`
  position: fixed;
  width: 550px;
  outline: 0px;
  margin: auto;
  background-color: rgb(46, 46, 46);
  border-radius: 32px;
  overflow: hidden;
`

const PageHeader = () => {
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  // const terraWallet = useWallet()
  // const lcdClient = useLCDClient(
  //   (process.env.REACT_APP_STAGE === "mainnet"
  //     ? terraConfigMainnet
  //     : terraConfigTestnet) as WalletLCDClientConfig
  // )
  // const connectedWallet = useConnectedWallet()
  // const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false)
  const [isKeplrWalletConnected, setIsKeplrWalletConnected] = useRecoilState(
    IsKeplrWalletConnected
  )
  // const [isTerraStationWalletConnected, setIsTerraStationWalletConnected] =
  //   useState(false)

  // useEffect(() => {
  //   if (!!connectedWallet) setIsTerraStationWalletConnected(true)
  // }, [connectedWallet])

  // useEffect(() => {
  //   ; (async () => {
  //     try {
  //       const accounts = await (window as any).ethereum.request({
  //         method: "eth_accounts",
  //       })
  //       if (accounts?.length > 0) setIsMetaMaskConnected(true)
  //     } catch (err) {
  //       console.error(err)
  //     }
  //   })()
  // }, [])

  useEffect(() => {
    if (!showWalletOptions) return

    const options = {
      render: (message: string, onConfirm: () => void) => {
        return (
          <StyledDialogBox>
            <StyledButton onClick={onConfirm}>
              <i className="fa fa-close"></i>
            </StyledButton>
            <div>{message}</div>
            <br />
          </StyledDialogBox>
        )
      },
    }

    const message: any = (
      <FlexColumn>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 500,
            letterSpacing: "-0.25px",
            color: "white"
          }}
        >
          Connect Wallet
        </h2>
        <div
          style={{
            width: "100%"
          }}
        >
          <WalletOption
            onClick={async () => {
              await new KeplrWallet("osmosis").connectToWallet(() => {
                setIsKeplrWalletConnected(true)
              })
            }}
            label={"Keplr Wallet"}
            image={require(`assets/svg/keplr.svg`).default}
            isConnected={isKeplrWalletConnected}
          />
          {/* <WalletOption
            onClick={async () =>
              new TerraWallet(
                terraWallet,
                lcdClient,
                connectedWallet
              ).connectToWallet()
            }
            label={"Terra Station"}
            image={require(`assets/svg/terra-station.svg`).default}
            isConnected={isTerraStationWalletConnected}
          />
          <WalletOption
            onClick={async () =>
              await new MetaMaskWallet("ethereum").connectToWallet(() =>
                setIsMetaMaskConnected(true)
              )
            }
            label={"MetaMask"}
            image={require(`assets/svg/metamask.svg`).default}
            isConnected={isMetaMaskConnected}
          /> */}
        </div>
      </FlexColumn>
    )
    confirm(message, options as any).then((done) => {
      done && setShowWalletOptions(false)
    })
  }, [
    showWalletOptions,
    setShowWalletOptions,
    // connectedWallet,
    // lcdClient,
    // terraWallet,
    // isMetaMaskConnected,
    isKeplrWalletConnected,
    // isTerraStationWalletConnected,
    setIsKeplrWalletConnected,
  ])

  // const pillStyle =
  //   process.env.REACT_APP_STAGE === "mainnet"
  //     ? { color: `green`, fontSize: `smaller`, fontWeight: `bolder` }
  //     : {
  //       color: `white`,
  //       fontSize: `smaller`,
  //       fontWeight: `bolder`,
  //       backgroundColor: `red`,
  //       padding: `0.3em`,
  //       borderRadius: `10px`,
  //     }

  return (
    <StyledPageHeader>
      <HeaderText>
        {/* <HeaderImage>Loop Bridge</HeaderImage>
        <ByText>
          <BoldSpan style={{ marginRight: `0.5em` }}>(BETA)</BoldSpan>
          Powered by Loop Finance
        </ByText> */}
        <img src={logLoop} width="75" />
      </HeaderText>
      <FlexRow>
        {ConnectWalletButton({
          isKeplrWalletConnected,
          // isMetaMaskConnected,
          // isTerraStationWalletConnected,
          cb: () => setShowWalletOptions(true),
        })}
        {/* {HeaderDivider()} */}
        {/* <div style={pillStyle}>
          {(process.env.REACT_APP_STAGE || "").toUpperCase()}
        </div>
        {HeaderDivider()} */}
      </FlexRow>
    </StyledPageHeader>
  )
}

const StyledWalletOption = styled(StyledConnectWalletButton)`
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  margin: 1em 2em 1em;
  padding: 10px 15px;
  border-radius: 10px;
  border-color: rgb(191, 32, 171);
  transition: all 0.3s ease 0s;
  color: rgb(255, 255, 255);
  background: rgb(32, 32, 32);
  &:hover {
    border-color: rgb(191, 32, 171);
    border-width: 1px;
    border-style: solid;
    opacity: 0.8;
  }
`

const WalletOption = ({ label, onClick, image, isConnected }: any) => {
  return (
    <StyledWalletOption onClick={onClick}>
      <p>{label}</p>
      <FlexRow>
        <SVGImage height={`24px`} width={`24px`} src={image} />
        {isConnected && (
          <FlexRow>
            <span style={{ backgroundColor: `green`, padding: `0.25em`, marginLeft: `0.5em` }}></span>
            <span style={{ fontSize: `0.8em`, marginLeft: `5px` }}>
              Connected
            </span>
          </FlexRow>
        )}
      </FlexRow>
    </StyledWalletOption>
  )
}
// const HeaderDivider = () => (
//   <div style={{ color: `grey`, margin: `0px 1em 0px 1em` }}>|</div>
// )

interface ConnectedWalletButtonProps {
  // isMetaMaskConnected: boolean
  isKeplrWalletConnected: boolean
  // isTerraStationWalletConnected: boolean
  cb: () => void
}
const ConnectWalletButton = (props: ConnectedWalletButtonProps) => {
  const {
    isKeplrWalletConnected,
    // isMetaMaskConnected,
    // isTerraStationWalletConnected,
    cb,
  } = props
  return (
    <div style={{ fontSize: `0.8em` }}>
      <StyledConnectWalletButton onClick={cb}>
        {isKeplrWalletConnected ? (
          // isMetaMaskConnected ||
          // isTerraStationWalletConnected ? (
          <FlexRow
            style={{
              padding: "7px 15px",
              borderRadius: "10px",
              backgroundColor: "#1b1b1b",
              color: "white",
              fontWeight: "bolder",
            }}
          >
            <FlexRow>
              <span
                style={{
                  backgroundColor: `green`,
                  padding: `0.35em`,
                  borderRadius: `2px`,
                  margin: `0.5em`,
                  border: `0.25px solid lightgrey`,
                }}
              ></span>
              <p style={{ marginRight: `0.5em` }}>Connected</p>
            </FlexRow>
            <FlexRow>
              {isKeplrWalletConnected && (
                <SVGImage
                  height={`1.25em`}
                  width={`1.25em`}
                  margin={`0.25em`}
                  src={require(`assets/svg/keplr.svg`).default}
                />
              )}
              {/* {isTerraStationWalletConnected && (
                <SVGImage
                  height={`1.25em`}
                  width={`1.25em`}
                  margin={`0.25em`}
                  src={require(`assets/svg/terra-station.svg`).default}
                />
              )}
              {isMetaMaskConnected && (
                <SVGImage
                  height={`1.25em`}
                  width={`1.25em`}
                  margin={`0.25em`}
                  src={require(`assets/svg/metamask.svg`).default}
                />
              )} */}
            </FlexRow>
          </FlexRow>
        ) : (
          <FlexRow>
            <ConnectWallet>Connect Wallet</ConnectWallet>
          </FlexRow>
        )}
      </StyledConnectWalletButton>
    </div>
  )
}

export default PageHeader
