import {
  createRef,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react"
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil"
import styled from "styled-components"
import {
  validateDestinationAddressByChainName,
} from "@axelar-network/axelarjs-sdk"
import { InputForm } from "components/CompositeComponents/InputForm"
import ChainSelector from "components/CompositeComponents/Selectors/ChainSelector"
import TransactionInfo from "components/CompositeComponents/TransactionInfo"
import { FlexColumn } from "components/StyleComponents/FlexColumn"
import { SVGImage } from "components/Widgets/SVGImage"
import ValidationErrorWidget from "components/Widgets/ValidationErrorWidget"
import { DESTINATION_TOKEN_KEY, ibcAssets, SOURCE_TOKEN_KEY, ROUTE_TOKEN_KEY, ibcChains, AssetInfo, ChainInfo } from "config/consts"
import screenConfigs from "config/screenConfigs"
import useResetUserInputs from "hooks/useResetUserInputs"
import { MetaMaskWallet } from "hooks/wallet/MetaMaskWallet"
import { KeplrWallet } from "hooks/wallet/KeplrWallet"
import { WalletInterface } from "hooks/wallet/WalletInterface"
import {
  ChainSelection,
  DestinationAddress,
  IsValidDestinationAddress,
  SourceAsset,
} from "state/ChainSelection"
import StyledButtonContainer from "../StyledComponents/StyledButtonContainer"
import StyledButton from "../StyledComponents/StyledButton"
// import TopFlowsSelectorWidget from "../TopFlowsSelector"
import { SendLogsToServer } from "api/SendLogsToServer"
import { BannedAddresses, ChainList } from "state/ChainList"
import { IsTxSubmitting, DepositAmount } from "state/TransactionStatus"
import {
  ROUTE_PARAM_ASSET,
  ROUTE_PARAM_DESTINATION_ADDRESS,
  ROUTE_PARAM_DST_CHAIN,
  ROUTE_PARAM_SRC_CHAIN,
  ROUTE_PARAM_TOKEN,
} from "config/route"
import useSearchParams from "hooks/useSearchParams"
import {
  terraConfigMainnet,
  terraConfigTestnet,
  TerraWallet,
} from "hooks/wallet/TerraWallet"
import {
  useConnectedWallet,
  useLCDClient,
  useWallet,
  WalletLCDClientConfig,
} from "@terra-money/wallet-provider"
import { IsKeplrWalletConnected } from "state/Wallet"
import AssetSelector from "components/CompositeComponents/Selectors/AssetSelector"
import { IBCTokenSelectedState } from "state/Others"
import { FlexRow } from "components/StyleComponents/FlexRow"

interface IUserInputWindowProps {
  handleTransactionSubmission: () => Promise<string>
}

const StyledUserInputWindow = styled.div`
  position: relative;
  overflow-y: hidden;
  width: 100%;
`

const StyledChainSelectorSection = styled.div`
  // overflow-y: hidden;
  @media ${screenConfigs.media.desktop} {
    // max-height: 500px;
    margin-top: 25px;
  }
  @media ${screenConfigs.media.laptop} {
    // max-height: 440px;
  }
  @media ${screenConfigs.media.tablet} {
    // max-height: 350px;
  }
  @media ${screenConfigs.media.mobile} {
    // max-height: 350px;
  }
`

const StyledInputFormSection = styled(FlexColumn)`
  @media ${screenConfigs.media.desktop} {
    margin-top: 50px;
    margin-bottom: 25px;
  }
  @media ${screenConfigs.media.laptop} {
    margin-top: 30px;
    margin-bottom: 20px;
  }
  @media ${screenConfigs.media.tablet} {
    margin-top: 5px;
    margin-bottom: 0px;
  }
  @media ${screenConfigs.media.mobile} {
    margin-top: 5px;
    margin-bottom: 0px;
  }
`

const StyledSVGImage = styled(SVGImage)`
  cursor: pointer;
`

const UserInputWindow = ({
  handleTransactionSubmission,
}: IUserInputWindowProps) => {
  const [searchParams, setSearchParams, deleteSearchParam] = useSearchParams()
  const [sourceChainSelection, setSourceChainSelection] = useRecoilState(
    ChainSelection(SOURCE_TOKEN_KEY)
  )
  const [destChainSelection, setDestChainSelection] = useRecoilState(
    ChainSelection(DESTINATION_TOKEN_KEY)
  )
  const [selectedSourceAsset, setSelectedSourceAsset] =
    useRecoilState(SourceAsset)
  const [destAddr, setDestAddr] = useRecoilState(DestinationAddress)
  const [isValidDestinationAddress, setIsValidDestinationAddress] =
    useRecoilState(IsValidDestinationAddress)
  const resetUserInputs = useResetUserInputs()
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const bannedAddresses = useRecoilValue<string[]>(BannedAddresses)
  const chainList = useRecoilValue(ChainList)
  const depositAmount = useRecoilValue(DepositAmount)
  const [isSubmitting, setIsSubmitting] = useRecoilState(IsTxSubmitting)
  const terraWallet = useWallet()
  const lcdClient = useLCDClient(
    (process.env.REACT_APP_STAGE === "mainnet"
      ? terraConfigMainnet
      : terraConfigTestnet) as WalletLCDClientConfig
  )
  const connectedWallet = useConnectedWallet()
  const [, setIsKeplrWalletConnected] = useRecoilState(IsKeplrWalletConnected);
  const srcChainComponentRef = createRef()
  const destChainComponentRef = createRef()
  const assetComponentRef = createRef()
  const resetDestinationChain = useResetRecoilState(
    ChainSelection(DESTINATION_TOKEN_KEY)
  )
  const [, setIBCTokenSelected] = useRecoilState(IBCTokenSelectedState)
  const [routeChain, setRouteChain] = useRecoilState(ChainSelection(ROUTE_TOKEN_KEY))

  // Read URL params and pre-fill chains and token input.
  useEffect(() => {
    const srcChainName: string =
      searchParams.get(ROUTE_PARAM_SRC_CHAIN)?.toLowerCase() || ""
    const dstChainName: string =
      searchParams.get(ROUTE_PARAM_DST_CHAIN)?.toLowerCase() || ""
    const tokenName: string =
      searchParams.get(ROUTE_PARAM_TOKEN)?.toLowerCase() || ""
    const assetDenom: string =
      searchParams.get(ROUTE_PARAM_ASSET)?.toLowerCase() || ""
    const destinationAddress: string =
      searchParams.get(ROUTE_PARAM_DESTINATION_ADDRESS)?.toLowerCase() || ""

    const srcChain = chainList.find(
      (chain) => chain.chainName.toLowerCase() === srcChainName
    )
    const dstChain = chainList.find(
      (chain) => chain.chainName.toLowerCase() === dstChainName
    )
    if (srcChain) {
      let selectedAsset: AssetInfo | undefined;
      const sourceChainSymbol = srcChain?.chainSymbol || "";
      if (assetDenom) {
        selectedAsset = srcChain?.assets?.concat(ibcAssets[sourceChainSymbol] || []).find(
          (asset) => asset.common_key === assetDenom.toLowerCase()
        )
      } else if (tokenName) {
        selectedAsset = srcChain?.assets?.concat(ibcAssets[sourceChainSymbol] || []).find(
          (asset) => asset.assetSymbol?.toLowerCase() === tokenName.toLowerCase()
        )
      }
      if (selectedAsset) {
        setSelectedSourceAsset(selectedAsset)
        if (selectedAsset.isIBCToken) setIBCTokenSelected(true)
        if (selectedAsset.isIBCToken) {
          if (selectedAsset.native_chain === srcChain?.chainName.toLowerCase() || selectedAsset.native_chain === dstChain?.chainName.toLowerCase()) {
            if (routeChain) setRouteChain(null)
          } else {
            if (selectedAsset.native_chain !== routeChain?.chainName.toLowerCase()) {
              const _routeChain = ibcChains.find((chain: ChainInfo) => {
                if (chain.chainName.toLowerCase() === selectedAsset?.native_chain) return true
                else return false
              })
              if (_routeChain && routeChain?.chainName !== _routeChain.chainName) setRouteChain(_routeChain)
            }
          }
        } else {
          if (routeChain) setRouteChain(null)
        }
      }
      setSourceChainSelection(srcChain)
    }
    dstChain && setDestChainSelection(dstChain)
    destinationAddress && setDestAddr(destinationAddress);
  }, [
    chainList,
    searchParams,
    // routeChain,
    setDestAddr,
    setDestChainSelection,
    setSelectedSourceAsset,
    setSourceChainSelection,
    setIBCTokenSelected,
    // setRouteChain,
  ])

  // Write URL params and when chains and token input get updated.
  useEffect(() => {
    if (sourceChainSelection) {
      setSearchParams(
        ROUTE_PARAM_SRC_CHAIN,
        sourceChainSelection?.chainName.toString().toLowerCase()
      )
    }
    if (
      destChainSelection &&
      selectedSourceAsset?.isIBCToken
    ) { } else if (
      destChainSelection &&
      selectedSourceAsset?.common_key &&
      !destChainSelection?.assets?.find(
        (destAsset) => destAsset?.common_key === selectedSourceAsset?.common_key
      )
    ) {
      setSearchParams(ROUTE_PARAM_DST_CHAIN, "")
      resetDestinationChain()
    } else if (destChainSelection) {
      setSearchParams(
        ROUTE_PARAM_DST_CHAIN,
        destChainSelection?.chainName.toString().toLowerCase()
      )
    }
    if (selectedSourceAsset?.common_key) {
      setSearchParams(
        ROUTE_PARAM_ASSET,
        selectedSourceAsset?.common_key
      )
      searchParams.get(ROUTE_PARAM_TOKEN) && deleteSearchParam(ROUTE_PARAM_TOKEN)
    }
    destAddr && setSearchParams(ROUTE_PARAM_DESTINATION_ADDRESS, destAddr)
  }, [
    destAddr,
    destChainSelection,
    selectedSourceAsset?.assetSymbol,
    selectedSourceAsset?.common_key,
    selectedSourceAsset?.isIBCToken,
    resetDestinationChain,
    deleteSearchParam,
    setSearchParams,
    searchParams,
    sourceChainSelection,
  ])

  useEffect(() => {
    const destToken: AssetInfo = {
      assetAddress: destAddr as string,
      assetSymbol: destChainSelection?.chainSymbol,
    }
    const validAddr: boolean = !!validateDestinationAddressByChainName(
      destChainSelection?.chainName || "",
      destToken.assetAddress || "",
      process.env.REACT_APP_STAGE as string
    )
    setIsValidDestinationAddress(validAddr)
  }, [destAddr, destChainSelection, setIsValidDestinationAddress])

  const onInitiateTransfer = useCallback(async () => {
    if (!(destAddr && isValidDestinationAddress)) return
    setIsSubmitting(true)
    try {
      await handleTransactionSubmission()
    } catch (e: any) {
      if (![403.1].includes(e.statusCode)) resetUserInputs()
      SendLogsToServer.info(
        "UserInputWindow_onInitiateTransfer",
        JSON.stringify(e),
        "NO_UUID"
      )
    }
  }, [
    destAddr,
    isValidDestinationAddress,
    handleTransactionSubmission,
    resetUserInputs,
    setIsSubmitting,
  ])

  const renderValidationErrors = useCallback((showValidationErrors: boolean) => {
    if (!showValidationErrors)
      return <ValidationErrorWidget text='Hidden' visibility="hidden" />
    if (!sourceChainSelection)
      return <ValidationErrorWidget text={`Select a source chain.`} />
    if (!selectedSourceAsset)
      return (
        <ValidationErrorWidget text={`Select an asset on the source chain.`} />
      )
    if (!destChainSelection)
      return <ValidationErrorWidget text={`Select a destination chain.`} />
    if (sourceChainSelection.chainName === destChainSelection.chainName)
      return (
        <ValidationErrorWidget
          text={`Source and destination chains can't be equal.`}
        />
      )
    if (!isValidDestinationAddress)
      return (
        <ValidationErrorWidget
          text={`Invalid input address for ${destChainSelection.chainName}.`}
        />
      )
    if (destAddr && bannedAddresses.includes(destAddr))
      return <ValidationErrorWidget text={`Cannot send to a Token Contract`} />
    if (selectedSourceAsset?.isIBCToken && !depositAmount)
      return <ValidationErrorWidget text={`Token amount is not valid`} />
  }, [
    sourceChainSelection,
    destChainSelection,
    selectedSourceAsset,
    isValidDestinationAddress,
    bannedAddresses,
    destAddr,
  ])

  const enableSubmitBtn =
    sourceChainSelection &&
    destChainSelection &&
    sourceChainSelection.chainName !== destChainSelection.chainName &&
    selectedSourceAsset &&
    isValidDestinationAddress &&
    destAddr &&
    !bannedAddresses.includes(destAddr) &&
    !(!depositAmount && selectedSourceAsset?.isIBCToken)

  const handleOnEnterPress = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
      ; (e.code === "Enter" || e.code === "NumpadEnter") &&
        enableSubmitBtn &&
        onInitiateTransfer()
  }

  const getDestinationAddressFromWallet = async (
    destinationChain: ChainInfo
  ) => {
    let wallet: WalletInterface
    const isEvm: boolean = destinationChain.module === "evm"
    wallet = isEvm
      ? new MetaMaskWallet(destinationChain.chainName.toLowerCase())
      : new KeplrWallet(destinationChain.chainName.toLowerCase())
    if (!wallet.isWalletInstalled() || !isEvm) await wallet.connectToWallet(() => setIsKeplrWalletConnected(true))
    wallet.isWalletInstalled() && setDestAddr(await wallet.getAddress())
  }

  const getDestinationAddressFromTerraWallet = async () => {
    let wallet: WalletInterface = new TerraWallet(
      terraWallet,
      lcdClient,
      connectedWallet
    )
    if (!wallet.isWalletInstalled()) await wallet.connectToWallet()
    wallet.isWalletInstalled() && setDestAddr(await wallet.getAddress())
  }

  /*closeAllSearchWindows is a method inside ChainSelector children called
  to programmatically close the asset search windows, i.e. when TopFlowsSelectorWidget is made */
  // const closeAllSearchWindows = () => {
  //   ; (srcChainComponentRef?.current as any)?.closeAllSearchWindows()
  //     ; (destChainComponentRef?.current as any)?.closeAllSearchWindows()
  //     ; (assetComponentRef?.current as any)?.closeAllSearchWindows()
  // }

  return (
    <StyledUserInputWindow>
      <FlexRow
        style={{
          color: "white"
        }}
      >
        <h2>Send</h2>
      </FlexRow>
      {/* <TopFlowsSelectorWidget closeAllSearchWindows={closeAllSearchWindows} /> */}
      <StyledChainSelectorSection className={"joyride-chain-selector"}>
        <ChainSelector
          ref={srcChainComponentRef}
          id={SOURCE_TOKEN_KEY}
          label={"FROM"}
          closeOtherWindow={() => {
            ; (destChainComponentRef?.current as any)?.closeAllSearchWindows()
              ; (assetComponentRef?.current as any)?.closeAllSearchWindows()
          }
          }
        />
        <ChainSelector
          ref={destChainComponentRef}
          id={DESTINATION_TOKEN_KEY}
          label={"TO"}
          closeOtherWindow={() => {
            ; (srcChainComponentRef?.current as any)?.closeAllSearchWindows()
              ; (assetComponentRef?.current as any)?.closeAllSearchWindows()
          }
          }
        />
        <AssetSelector
          ref={assetComponentRef}
          label={"Asset"}
          closeOtherWindow={() => {
            ; (srcChainComponentRef?.current as any)?.closeAllSearchWindows()
              ; (destChainComponentRef?.current as any)?.closeAllSearchWindows()
          }
          }
        />
        <br />
        <TransactionInfo />
        <StyledInputFormSection>
          <InputForm
            name={"destination-address-input"}
            value={destAddr || ""}
            placeholder={"Destination Address"}
            type={"text"}
            handleOnEnterPress={handleOnEnterPress}
            onChange={(e: any) => setDestAddr(e.target.value)}
          />
          {destChainSelection && (
            <div
              style={{
                width: `100%`,
                height: `100%`,
                color: `#898994`,
                marginTop: `0.5em`,
                textAlign: `right`,
                fontSize: `0.8em`,
                display: `flex`,
                justifyContent: `flex-end`,
                alignItems: `flex-start`,
              }}
            >
              <span
                style={{ cursor: `pointer` }}
                onClick={() =>
                  getDestinationAddressFromWallet(
                    destChainSelection as ChainInfo
                  )
                }
              >
                Autofill from:
              </span>
              <StyledSVGImage
                onClick={() =>
                  getDestinationAddressFromWallet(
                    destChainSelection as ChainInfo
                  )
                }
                height={`1.25em`}
                width={`1.25em`}
                margin={`0em 0.5em 0em 0.5em`}
                src={
                  destChainSelection.module === "axelarnet"
                    ? require(`assets/svg/keplr.svg`).default
                    : require(`assets/svg/metamask.svg`).default
                }
              />
              {destChainSelection?.chainName?.toLowerCase() === "terra" && (
                <>
                  <span>OR</span>
                  <StyledSVGImage
                    onClick={getDestinationAddressFromTerraWallet}
                    height={`1.35em`}
                    width={`1.35em`}
                    margin={`0em 0.5em 0em 0.5em`}
                    src={require(`assets/svg/terra-station.svg`).default}
                  />
                </>
              )}
            </div>
          )}
        </StyledInputFormSection>
      </StyledChainSelectorSection>
      {renderValidationErrors(showValidationErrors)}
      <StyledButtonContainer className={"joyride-input-button"}>
        <StyledButton
          dim={!enableSubmitBtn}
          onClick={() => enableSubmitBtn && onInitiateTransfer()}
          onMouseEnter={() => {
            if (!enableSubmitBtn) setShowValidationErrors(true)
          }}
          onMouseLeave={() => {
            setShowValidationErrors(false)
          }}
        >
          {isSubmitting
            ? "Please check Keplr Wallet..."
            : "Next"}
        </StyledButton>
      </StyledButtonContainer>
    </StyledUserInputWindow>
  )
}

export default UserInputWindow
