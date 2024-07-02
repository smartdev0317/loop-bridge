import { getConfigs } from "@axelar-network/axelarjs-sdk"
import styled, { ThemedStyledProps } from "styled-components"
import { useCallback, useEffect, useState } from "react"
import { confirm } from "react-confirm-box"
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import { AssetInfo, ChainInfo, DESTINATION_TOKEN_KEY, SOURCE_TOKEN_KEY } from "config/consts"
import screenConfigs from "config/screenConfigs"
import { StyledChainSelectionIconWidget } from "components/CompositeComponents/Selectors/ChainSelector/StyleComponents/StyledChainSelectionIconWidget"
import { SelectedChainLogoAndText } from "components/CompositeComponents/Selectors/ChainSelector/SelectedChainLogoAndText"
import { opacityAnimation } from "components/StyleComponents/animations/OpacityAnimation"
import { FlexRow } from "components/StyleComponents/FlexRow"
import configs from "config/downstreamServices"
import BoldSpan from "components/StyleComponents/BoldSpan"
import { PopoutLink } from "components/Widgets/PopoutLink"
import useResetAllState from "hooks/useResetAllState"
import { MetaMaskWallet } from "hooks/wallet/MetaMaskWallet"
import { KeplrWallet } from "hooks/wallet/KeplrWallet"
import {
  terraConfigMainnet,
  terraConfigTestnet,
  TerraWallet,
} from "hooks/wallet/TerraWallet"
import { WalletInterface } from "hooks/wallet/WalletInterface"
import { MessageShownInCartoon } from "state/ApplicationStatus"
import {
  ActiveStep,
  DidWaitingForDepositTimeout,
  HasEnoughDepositConfirmation,
  IConfirmationStatus,
  NumberConfirmations,
  SourceDepositAddress,
  SrcChainDepositTxHash,
} from "state/TransactionStatus"
import {
  ChainSelection,
  DestinationAddress,
  SourceAsset,
} from "state/ChainSelection"
import StyledButtonContainer from "../StyledComponents/StyledButtonContainer"
import PlainButton from "../StyledComponents/PlainButton"
import StatusList from "./StatusList"
import {
  useConnectedWallet,
  useLCDClient,
  useWallet,
  WalletLCDClientConfig,
} from "@terra-money/wallet-provider"
import {
  IsKeplrWalletConnected,
  SelectedWallet,
  WalletType,
} from "state/Wallet"
import { buildDepositConfirmationRoomId } from "api/AxelarEventListener"
import { SocketService } from "api/WaitService/SocketService"
import { transferEvent } from "api/WaitService"
import { FlexColumn } from "components/StyleComponents/FlexColumn"
import { popupOptions } from "components/Widgets/PopupOptions"
import { getMinDepositAmount } from "utils/getMinDepositAmount"
import { BigNumber, ethers } from "ethers"
import decimaljs from "decimal.js"
import debounce from "lodash.debounce"
import { hasSelectedWrappedNativeAsset } from "utils/hasSelectedWrappedNativeAsset"
import { nativeAsset } from "config/contracts/deployedContractAddresses"
import { StyledCloseButton } from "components/StyleComponents/StyledButton"

interface ITransactionStatusWindowProps {
  isOpen: boolean
  closeResultsScreen: any
}

interface IStyledDivProps extends ThemedStyledProps<any, any> {
  appear?: any
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

const StyledFlexRow = styled(FlexRow)`
  padding: 10px;
  box-sizing: border-box;
  border-radius: 9px;
  box-shadow: inset 0 0 3px 1px rgba(0, 0, 0, 0.16);
  background-color: #fefefe;
`

const TransactionStatusWindow = ({
  isOpen,
  closeResultsScreen,
}: ITransactionStatusWindowProps) => {
  const [sourceConfirmStatus, setSourceConfirmStatus] = useRecoilState(
    NumberConfirmations(SOURCE_TOKEN_KEY)
  )
  const [destinationConfirmStatus, setDestinationConfirmStatus] =
    useRecoilState(NumberConfirmations(DESTINATION_TOKEN_KEY))
  const destinationChain = useRecoilValue(ChainSelection(DESTINATION_TOKEN_KEY))
  const destinationAddress = useRecoilValue(DestinationAddress)
  const sourceChain = useRecoilValue(ChainSelection(SOURCE_TOKEN_KEY))
  const depositAddress = useRecoilValue(SourceDepositAddress)
  const setCartoonMessage = useSetRecoilState(MessageShownInCartoon)
  const [activeStep, setActiveStep] = useRecoilState(ActiveStep)
  const [selectedWallet, setSelectedWallet] =
    useRecoilState<WalletType>(SelectedWallet)
  const resetAllstate = useResetAllState()
  const selectedSourceAsset = useRecoilValue(SourceAsset)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletAddress, setWalletAddress] = useState("")
  const [userConfirmed, setUserconfirmed] = useState(false)
  const [walletToUse, setWalletToUse] = useState<WalletInterface | null>()
  const terraWallet = useWallet()
  const [, setIsKeplrWalletConnected] = useRecoilState(IsKeplrWalletConnected)
  const [txHash, setTxHash] = useRecoilState(SrcChainDepositTxHash)
  const [hasEnoughDepositConfirmation] = useRecoilState(
    HasEnoughDepositConfirmation
  )
  const lcdClient = useLCDClient(
    (process.env.REACT_APP_STAGE === "mainnet"
      ? terraConfigMainnet
      : terraConfigTestnet) as WalletLCDClientConfig
  )
  const connectedWallet = useConnectedWallet()
  const didWaitingForDepositTimeout = useRecoilValue(
    DidWaitingForDepositTimeout
  )

  const [cumDepAmt, setCumDepAmt] = useState(0)
  const [minDepositAmt] = useState(
    getMinDepositAmount(selectedSourceAsset, sourceChain, destinationChain) || 0
  )

  const [socketService] = useState(
    new SocketService(
      getConfigs(process.env.REACT_APP_STAGE as string).resourceUrl
    )
  )
  const [depositListenerEstablished, setDepositListenerEstablished] =
    useState(false)

  useEffect(() => {
    if (!sourceConfirmStatus?.amountConfirmedString) return
    const amountConfirmedAtomicUnits: number = parseFloat(
      sourceConfirmStatus.amountConfirmedString.replace(/[^\d.]*/g, "")
    )
    if (!amountConfirmedAtomicUnits) return
    const amountConfirmedAdjusted: number = +ethers.utils.formatUnits(
      BigNumber.from(amountConfirmedAtomicUnits.toString()),
      selectedSourceAsset?.decimals
    )
    if (amountConfirmedAdjusted)
      setCumDepAmt((cumDepAmt) =>
        new decimaljs(amountConfirmedAdjusted).add(cumDepAmt).toNumber()
      )
  }, [
    sourceConfirmStatus,
    sourceConfirmStatus?.amountConfirmedString,
    selectedSourceAsset,
    setCumDepAmt,
  ])

  useEffect(() => {
    if (selectedWallet !== WalletType.TERRA) return

    let msg = ""

    const isMainnet = process.env.REACT_APP_STAGE === "mainnet"

    if (isMainnet && terraWallet?.network?.chainID !== "phoenix-1") {
      msg =
        "Your Terra Station extension is not set to mainnet. Please switch those settings before trying to send any funds."
    } else if (!isMainnet && terraWallet?.network?.chainID !== "pisco-1") {
      msg =
        "Your Terra Station extension is not set to testnet. Please switch those settings before trying to send any funds."
    } else return

    const message: any = (
      <FlexColumn>
        <h3>
          <BoldSpan>Warning</BoldSpan>
        </h3>
        {msg}
      </FlexColumn>
    )
    confirm(message, popupOptions as any).then((positiveAffirmation) => {
      if (!positiveAffirmation) {
        resetAllstate()
        closeResultsScreen()
      }
    })
  }, [selectedWallet, terraWallet, closeResultsScreen, resetAllstate])

  const connectToWallet = async (walletType: WalletType) => {
    setSelectedWallet(walletType)
    if (walletType === WalletType.METAMASK) {
      let wallet: MetaMaskWallet = new MetaMaskWallet(
        sourceChain?.chainName.toLowerCase() as string
      )
      setWalletToUse(wallet)
      const isWalletInstalled: boolean = wallet.isWalletInstalled() as boolean
      setIsWalletConnected(isWalletInstalled)
      if (!isWalletInstalled) return
      await wallet.connectToWallet()
      const balance = await wallet.getBalance(
        selectedSourceAsset as AssetInfo,
        sourceChain?.chainName
      )
      setWalletBalance(balance)
      setWalletAddress(await wallet.getAddress())
    } else {
      let wallet: WalletInterface
      if (!sourceChain?.chainName) return

      if (walletType === WalletType.TERRA) {
        wallet = new TerraWallet(terraWallet, lcdClient, connectedWallet)
      } else {
        wallet = new KeplrWallet(sourceChain?.chainName.toLowerCase())
      }

      const isWalletInstalled: boolean = wallet.isWalletInstalled() as boolean
      if (!isWalletInstalled) return
      await wallet.connectToWallet(
        walletType === WalletType.KEPLR
          ? () => setIsKeplrWalletConnected(true)
          : null
      )

      const address = await wallet.getAddress()
      if (!address) return
      setWalletToUse(wallet)
      setIsWalletConnected(isWalletInstalled)
      const balance: number = await wallet.getBalance(
        selectedSourceAsset as AssetInfo
      )
      setWalletBalance(balance)
      setWalletAddress(address)
    }
  }

  const updateBalance = useCallback(async () => {
    if (!walletToUse) return

    const balance = await walletToUse.getBalance(
      selectedSourceAsset as AssetInfo,
      sourceChain?.chainName
    )
    setWalletBalance(balance)
    setWalletAddress(await walletToUse.getAddress())
  }, [walletToUse, selectedSourceAsset, sourceChain?.chainName])

  const {
    numberConfirmations: sNumConfirms,
    numberRequiredConfirmations: sReqNumConfirms,
  } = sourceConfirmStatus
  const {
    numberConfirmations: dNumConfirms,
    numberRequiredConfirmations: dReqNumConfirms,
  } = destinationConfirmStatus

  useEffect(() => {
    //todo: need to improve this, the 'right' way of doing something like this is here: https://bugfender.com/blog/react-hooks-common-mistakes/
    switch (true) {
      case didWaitingForDepositTimeout:
        break
      case !!(dNumConfirms && dReqNumConfirms):
        setActiveStep(4)
        break
      case (txHash && txHash.length > 0 && hasEnoughDepositConfirmation) ||
        !!(sNumConfirms && sReqNumConfirms):
        setActiveStep(3)
        break
      case depositAddress !== null:
        setActiveStep(2)
        connectToWallet(WalletType.KEPLR)
        break
      default:
        setActiveStep(1)
        break
    }
  }, [
    dNumConfirms,
    dReqNumConfirms,
    depositAddress,
    setCartoonMessage,
    setActiveStep,
    didWaitingForDepositTimeout,
    txHash,
    hasEnoughDepositConfirmation,
    sNumConfirms,
    sReqNumConfirms,
  ])

  const cb = useCallback(
    (res: any) => {
      const incomingTxHash: string = res?.Attributes?.txID || ""
      const confirms: IConfirmationStatus = {
        numberConfirmations: 1,
        numberRequiredConfirmations: 1,
        transactionHash: incomingTxHash,
        amountConfirmedString: res?.Attributes?.amount,
        height: res?.Height,
      }
      incomingTxHash?.length > 0 &&
        txHash !== incomingTxHash &&
        setTxHash(incomingTxHash)
      sourceConfirmStatus?.height !== confirms.height &&
        setSourceConfirmStatus(confirms)
    },
    [sourceConfirmStatus, setSourceConfirmStatus, setTxHash, txHash]
  )

  useEffect(() => {
    ; (async () => {
      if (cumDepAmt > minDepositAmt) socketService.disconnect()
      if (activeStep < 2 || depositListenerEstablished) return
      setDepositListenerEstablished(true)
      const roomId = buildDepositConfirmationRoomId(
        sourceChain?.module as string,
        depositAddress?.assetAddress as string,
        sourceChain?.chainName as string,
        destinationChain?.chainName as string,
        selectedSourceAsset?.common_key as string
      )
      await socketService.joinRoomAndWaitForEvent(roomId, debounce(cb, 2000))
    })()
  }, [
    activeStep,
    depositListenerEstablished,
    depositAddress?.assetAddress,
    selectedSourceAsset?.common_key,
    socketService,
    sourceChain?.chainName,
    sourceChain?.module,
    destinationChain?.chainName,
    cb,
    cumDepAmt,
    minDepositAmt,
  ])

  useEffect(() => {
    ; (async () => {
      if (!depositAddress) return

      const res = await transferEvent(
        destinationChain as ChainInfo,
        selectedSourceAsset as AssetInfo,
        destinationAddress as string
      )

      const confirms: IConfirmationStatus = {
        numberConfirmations: 1,
        numberRequiredConfirmations: 1,
        transactionHash: res.transactionHash,
        amountConfirmedString: "",
        height: res.Height,
      }

      setDestinationConfirmStatus(confirms)
    })()
  }, [
    activeStep,
    destinationChain,
    sourceChain,
    selectedSourceAsset,
    destinationAddress,
    setDestinationConfirmStatus,
    depositAddress,
    setActiveStep,
  ])

  useEffect(() => {
    if (activeStep === 2 && !userConfirmed) {
      let message: any = []

      if (sourceChain?.module === "evm") {
        if (
          sourceChain.chainName.toLowerCase() !==
          selectedSourceAsset?.native_chain
        ) {
          message.push(
            <div>
              Only send{" "}
              {<BoldSpan>{selectedSourceAsset?.assetName}</BoldSpan>} to this
              deposit address on {sourceChain.chainName}. Any other tokens sent
              to this address will be lost.
              <br />
              <br />
            </div>
          )
        } else if (
          hasSelectedWrappedNativeAsset(
            selectedSourceAsset,
            sourceChain?.chainName?.toLowerCase()
          )
        ) {
          message.push(
            <div>
              Only send {" "}
              {<BoldSpan>{selectedSourceAsset?.assetName}</BoldSpan>} to this{" "}
              {sourceChain.chainName} deposit address. Native{" "}
              {nativeAsset[sourceChain.chainName.toLowerCase()]} or any other
              tokens sent to this address will be lost.
              <br /><br />
              <div>Find out how to convert {nativeAsset[sourceChain.chainName.toLowerCase()]} to {selectedSourceAsset?.assetName} {" "}
                <PopoutLink
                  text={"here"}
                  onClick={() =>
                    window.open(
                      "https://docs.axelar.dev/resources/weth",
                      "_blank"
                    )
                  }
                />
              </div>
              <br />
            </div>
          )
        }
      }

      if (destinationChain?.module === "evm") {
        const destAssetName: string = destinationChain.assets?.find(
          (asset) =>
            asset.common_key === selectedSourceAsset?.common_key
        )?.assetName || "";
        if (
          destinationChain.chainName.toLowerCase() !==
          selectedSourceAsset?.native_chain
        ) {
          message.push(
            <span>
              The recipient will receive{" "}
              {
                <BoldSpan>{destAssetName}</BoldSpan>
              }{" "}
              on {destinationChain.chainName}.{" "}
            </span>
          )
        }
        message.push(
          <span>
            If your recipient doesn’t support {destAssetName}, the funds will be
            lost.
            <br />
            <br />
          </span>
        )
      }

      if (message?.length > 0) {
        message.push(
          <div>
            The correct ERC20 token addresses can be
            verified{" "}
            <PopoutLink
              text={"here"}
              onClick={() =>
                window.open(
                  configs.tokenContracts[process.env.REACT_APP_STAGE as string],
                  "_blank"
                )
              }
            />
          </div>
        )
      } else {
        return;
      }

      confirm(message, popupOptions as any).then((positiveAffirmation) => {
        if (positiveAffirmation) {
          setUserconfirmed(true)
        } else {
          resetAllstate()
          closeResultsScreen()
        }
      })
    }
  }, [
    resetAllstate,
    selectedSourceAsset,
    sourceChain,
    destinationChain,
    userConfirmed,
    closeResultsScreen,
    activeStep,
  ])

  const showButton: boolean = activeStep > 2

  return (
    <StyledTransactionStatusWindow>
      <StyledCloseButton onClick={() => {
        resetAllstate()
        closeResultsScreen()
      }}>
        <i className="fa fa-angle-left"></i>
      </StyledCloseButton>
      <FlexRow
        style={{
          color: "white"
        }}
      >
        <h2>{activeStep < 3 ? "Transferring" : "Complete!"}</h2>
      </FlexRow>
      <StatusList
        activeStep={activeStep}
        isWalletConnected={isWalletConnected}
        connectToWallet={connectToWallet}
        walletBalance={walletBalance}
        reloadBalance={updateBalance}
        walletAddress={walletAddress}
        depositAddress={depositAddress as AssetInfo}
        cumDepAmt={cumDepAmt}
        minDepositAmt={minDepositAmt}
      />
      <br />

      <StyledButtonContainer>
        {showButton && (
          <PlainButton
            disabled={!showButton}
            dim={!showButton}
            onClick={() => {
              resetAllstate()
              closeResultsScreen()
            }}
          >
            Start New Transaction
          </PlainButton>
        )}
      </StyledButtonContainer>
    </StyledTransactionStatusWindow>
  )
}

export default TransactionStatusWindow
