import React, { useCallback, useEffect, useImperativeHandle, useState } from "react"
import { useRecoilValue, useRecoilState, useSetRecoilState } from "recoil"
import { SVGImage } from "components/Widgets/SVGImage"
import { ChainSelection, DestinationAddress, SourceAsset } from "state/ChainSelection"
import { BaseSelector } from "../BaseSelector"
import { AssetInfo, axelarAssets, ChainInfo, DESTINATION_TOKEN_KEY, ibcAssets, ibcChains, ROUTE_TOKEN_KEY, SOURCE_TOKEN_KEY } from "config/consts"
import { getAssetSymbolToShow } from "utils/getAssetSymbolToShow"
import { StyledAssetSelectionIconWidget } from "../ChainSelector/StyleComponents/StyledChainSelectionIconWidget"
import SearchComponent from "components/Widgets/SearchComponent"
import { ChainList } from "state/ChainList"
import { StyledChainSelectionComponent } from "../ChainSelector/StyleComponents/StyledChainSelectionComponent"
import { IBCTokenSelectedState } from "state/Others"
import { FlexSpaceBetween } from "components/StyleComponents/FlexSpaceBetween"
import { ethers } from "ethers"
import { SigningStargateClient } from "@cosmjs/stargate"
import {
  IsKeplrWalletConnected,
  SelectedWallet,
  WalletType,
} from "state/Wallet"
import keplrService from "./StatusList/keplrService"
import { InputForm } from "components/CompositeComponents/InputForm"
import { AXELAR_TRANSFER_GAS_LIMIT, TERRA_IBC_GAS_LIMIT } from "config/gas"
import decimaljs from "decimal.js"
import { getNumber } from "utils/formatNumber"
import LoadingWidget from "components/Widgets/LoadingWidget"
import { DepositAmount } from "state/TransactionStatus"
import BoldSpan from "components/StyleComponents/BoldSpan"
import { FlexRow } from "components/StyleComponents/FlexRow"
import ValidationErrorWidget from "components/Widgets/ValidationErrorWidget"
import { getMinDepositAmount } from "utils/getMinDepositAmount"

interface IAssetSelectorProps {
  label: string
  animate?: boolean
  hideContents?: boolean
  ref: any
  closeOtherWindow: () => void
}

const AssetSelector = React.forwardRef((props: IAssetSelectorProps, ref) => {
  const sourceChain = useRecoilValue(ChainSelection(SOURCE_TOKEN_KEY))
  const destChain = useRecoilValue(ChainSelection(DESTINATION_TOKEN_KEY))
  const [routeChain, setRouteChain] = useRecoilState(ChainSelection(ROUTE_TOKEN_KEY))
  const chainList = useRecoilValue(ChainList)
  const destinationChain = useRecoilValue<ChainInfo | null>(
    ChainSelection(DESTINATION_TOKEN_KEY)
  )
  // console.log(routeChain)
  const [selectedToken, setSourceAsset] = useRecoilState(SourceAsset)
  const [showAssetSearchBox, setShowAssetSearchBox] = useState<boolean>(false)
  const [isIBCTokenSelected, setIBCTokenSelected] = useRecoilState(IBCTokenSelectedState)
  const setIsKeplrWalletConnected = useSetRecoilState(IsKeplrWalletConnected)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletToUse, setWalletToUse] = useState<SigningStargateClient | null>()
  const [walletAddress, setWalletAddress] = useState("")
  const [amountToDeposit, setAmountToDeposit] = useState<string>("")
  const setDepositAmount = useSetRecoilState(DepositAmount)
  const [isLoading, setIsLoading] = useState(false)
  const [smallAmountError, setSmallAmountError] = useState(false)
  // console.log("isIBCTokenSelected:", isIBCTokenSelected)
  let initialAssetList: AssetInfo[] =
    chainList?.find((chain) => chain?.chainName === sourceChain?.chainName)
      ?.assets?.filter(each => {
        const assetSymbol: string = each.assetSymbol || ""
        return axelarAssets.includes(assetSymbol.toLowerCase())
      }) || []
  const sourceChainSymbol = sourceChain?.chainSymbol || ""
  initialAssetList = initialAssetList.concat(ibcAssets[sourceChainSymbol] || [])
  // console.log("initialAssetList:", initialAssetList)

  /*closeAllSearchWindows is a ref method called
  from the parent component (UserInputWindow/index.tsx)
  to programmatically close the asset search windows */
  useImperativeHandle(ref, () => ({
    closeAllSearchWindows() {
      setShowAssetSearchBox(false)
    },
  }))

  let image

  try {
    image =
      require(`assets/svg/tokenAssets/${selectedToken?.common_key}.svg`)?.default
  } catch (e) {
    // image = require(`assets/svg/select-asset-eyes.svg`)?.default
  }

  const minDeposit: number | null = getMinDepositAmount(
    selectedToken,
    sourceChain,
    destChain
  )

  const onClick = () => {
    if (!sourceChain || !destinationChain) return;
    props.closeOtherWindow()
    /*if you're about to toggle open the asset selector search box
     * and the chain search box is already open, close the chain search box first */
    setShowAssetSearchBox(!showAssetSearchBox)
  }

  useEffect(() => {
    if (!selectedToken?.ibcDenom || !selectedToken?.isIBCToken) return
    setTimeout(() => {
      const walletType = WalletType.KEPLR
      connectToWallet(walletType)
    }, 100)
  }, [selectedToken?.ibcDenom])

  useEffect(() => {
    if (!minDeposit || !amountToDeposit) {
      setSmallAmountError(false)
      return
    }
    if (Number(amountToDeposit) <= minDeposit) {
      setSmallAmountError(true)
    } else {
      setSmallAmountError(false)
    }
  }, [amountToDeposit])

  const connectToWallet = async (walletType: WalletType) => {
    let connectionSourceChain, connectionRouteChain
    if (keplrService.checkInstalled() && sourceChain && selectedToken) {
      setIsLoading(true)
      try {
        if (!routeChain) {
          connectionSourceChain = await keplrService.connect(
            sourceChain
          )
          if (!connectionSourceChain) return
        }
        if (routeChain) {
          connectionSourceChain = await keplrService.connect(
            sourceChain
          )
          connectionRouteChain = await keplrService.connect(
            routeChain
          )
        }
        setIsKeplrWalletConnected(true)
        setWalletToUse(connectionSourceChain?.signingCosmosClient)
        setWalletAddress(connectionSourceChain?.address || "")
        const balance = await connectionSourceChain?.signingCosmosClient.getBalance(connectionSourceChain?.address, selectedToken.ibcDenom || "")
        setWalletBalance(Number(balance?.amount) / Math.pow(10, selectedToken.decimals || 0))
        setIsLoading(false)
      } catch (e) {
        setIsLoading(false)
      }
    } else {
      return
    }
  }

  const updateBalance = useCallback(async () => {
    if (!walletToUse) return
    const balance = await walletToUse.getBalance(
      walletAddress,
      selectedToken?.ibcDenom || ""
    )
    setWalletBalance(Number(balance.amount) / Math.pow(10, selectedToken?.decimals || 0))
  }, [walletToUse, selectedToken, walletAddress])

  const handleMaxClick = () => {
    const highGasPrice = 0.2
    if (
      sourceChain?.chainName?.toLowerCase() === "terra" &&
      selectedToken?.common_key === "uluna"
    ) {
      const fee = parseFloat(
        ethers.utils.formatUnits(
          highGasPrice * parseInt(TERRA_IBC_GAS_LIMIT),
          selectedToken?.decimals || 6
        )
      )
      const maxWithFee = walletBalance - fee
      const roundedMax = (Math.floor(maxWithFee * 100) / 100).toFixed(2)
      setAmountToDeposit(roundedMax)
      setDepositAmount(roundedMax)
    } else if (
      sourceChain?.chainName?.toLowerCase() === "axelar" &&
      selectedToken?.common_key === "uaxl"
    ) {
      const fee = parseFloat(
        ethers.utils.formatUnits(
          highGasPrice * parseInt(AXELAR_TRANSFER_GAS_LIMIT),
          selectedToken?.decimals || 6
        )
      )
      const maxWithFee = walletBalance - fee
      const roundedMax = (Math.floor(maxWithFee * 10000) / 10000)
      setAmountToDeposit(new decimaljs(roundedMax).toString())
      setDepositAmount(new decimaljs(roundedMax).toString())
    } else {
      const roundedMax = (Math.floor(walletBalance * 10000) / 10000)
      setAmountToDeposit(new decimaljs(roundedMax).toString())
      setDepositAmount(new decimaljs(roundedMax).toString())
    }
  }

  /**
   * For the label, if source chain is cosmos and token is native to the destination chain,
   * then use the symbol representation for the destination chain
   */
  return (
    <StyledChainSelectionComponent>
      <div style={{ margin: `30px 0px 20px`, color: `#898994`, fontSize: `0.9em`, display: 'flex', alignItems: 'center' }}>
        Asset
      </div>
      <FlexSpaceBetween style={{ width: `100%`, marginRight: `5px` }}>
        <StyledAssetSelectionIconWidget onClick={onClick} style={{ cursor: `pointer` }}>
          <BaseSelector
            image={image && <SVGImage height={"1.75em"} width={"1.75em"} src={image} />}
            label={
              selectedToken
                ? getAssetSymbolToShow(
                  sourceChain as ChainInfo,
                  destChain as ChainInfo,
                  selectedToken,
                  selectedToken?.assetName
                )
                : `Select asset`
            }
          />
          <SVGImage
            src={
              require(showAssetSearchBox
                ? `assets/svg/drop-up-arrow.svg`
                : `assets/svg/drop-down-arrow.svg`)?.default
            }
            height={"0.75em"}
            width={"0.75em"}
          />
        </StyledAssetSelectionIconWidget>
      </FlexSpaceBetween>

      {/*search dropdown for asset selection*/}
      <SearchComponent
        show={showAssetSearchBox}
        allItems={initialAssetList
          .filter((asset: AssetInfo) =>
            process.env.REACT_APP_STAGE === "mainnet"
              ? asset.fullySupported
              : true
          )
          .map((asset: AssetInfo) => {
            return {
              /**
               * For the title, if source chain is cosmos and token is native to the destination chain, 
               * then use the symbol representation for the destination chain
               */
              title: getAssetSymbolToShow(sourceChain as ChainInfo, destinationChain as ChainInfo, asset, asset.assetName || "",),
              symbol: asset.assetSymbol as string,
              active: false,
              icon: require(`assets/svg/tokenAssets/${asset?.common_key}.svg`)
                ?.default,
              disabled: false,
              onClick: () => {
                setSourceAsset(asset)
                if (asset.isIBCToken && !isIBCTokenSelected) setIBCTokenSelected(true)
                if (!asset.isIBCToken && isIBCTokenSelected) setIBCTokenSelected(false)
                if (asset.isIBCToken) {
                  if (asset.native_chain === sourceChain?.chainName.toLowerCase() || asset.native_chain === destinationChain?.chainName.toLowerCase()) {
                    if (routeChain) setRouteChain(null)
                  } else {
                    if (asset.native_chain !== routeChain?.chainName.toLowerCase()) {
                      const _routeChain = ibcChains.find((chain: ChainInfo) => {
                        if (chain.chainName.toLowerCase() === asset.native_chain) return true
                        else return false
                      })
                      if (_routeChain) setRouteChain(_routeChain)
                    }
                  }
                } else {
                  if (routeChain) setRouteChain(null)
                }
              },
            }
          })}
        handleClose={() => setShowAssetSearchBox(false)}
      />
      {
        selectedToken && selectedToken?.isIBCToken &&
        <div
          style={{
            position: "relative",
            width: "100%"
          }}
        >
          <FlexRow
            style={{
              justifyContent: "space-between",
              margin: `40px 0px 10px`,
            }}
          >
            <div style={{ color: `#898994`, fontSize: `0.9em`, display: 'flex', alignItems: 'center' }}>
              Amount
            </div>
            {
              isLoading ?
                <span style={{ color: `white`, fontSize: `0.8em` }}>
                  Loading...
                </span> :
                <span style={{ color: `white`, fontSize: `0.8em` }}>
                  Balance: <BoldSpan>~{getNumber(walletBalance, selectedToken?.decimals)} </BoldSpan>
                  <LoadingWidget cb={updateBalance} />
                </span>
            }
          </FlexRow>
          <FlexSpaceBetween style={{ width: `100%`, position: "relative", marginRight: `5px` }}>
            <InputForm
              name={"destination-address-input"}
              value={
                amountToDeposit
                  ?.replace(/[^.0-9]/g, "") || ""
                // ?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "" //TODO: want the thousands separator but need to get this working for small decimals
              }
              placeholder={"Deposit Amount"}
              type={"text"}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAmountToDeposit(e.target.value?.replace(/,/g, ""))
                setDepositAmount(e.target.value?.replace(/,/g, ""))
              }}
            />
            {walletBalance > 0 && (
              <div
                style={{
                  position: `absolute`,
                  color: "grey",
                  right: `0.5em`,
                  top: `0.8em`,
                  fontSize: `0.8em`,
                  cursor: "pointer",
                }}
                onClick={handleMaxClick}
              >
                Max
              </div>
            )}
          </FlexSpaceBetween>
          {smallAmountError &&
            <ValidationErrorWidget text='Send amount must be greater than fee amount' />
          }
        </div>
      }
    </StyledChainSelectionComponent>
  )
})

export default AssetSelector
