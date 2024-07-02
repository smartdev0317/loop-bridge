import React, { useImperativeHandle, useState } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import { AssetInfo, ChainInfo, SOURCE_TOKEN_KEY } from "config/consts"
// import AssetSelector from "components/CompositeComponents/Selectors/AssetSelector"
import { FlexSpaceBetween } from "components/StyleComponents/FlexSpaceBetween"
import SearchComponent, {
  ISearchItem,
} from "components/Widgets/SearchComponent"
import { SVGImage } from "components/Widgets/SVGImage"
import { ChainSelection, SourceAsset } from "state/ChainSelection"
import { ChainList } from "state/ChainList"
import { StyledChainSelectionComponent } from "./StyleComponents/StyledChainSelectionComponent"
import { StyledChainSelectionIconWidget, ActiveStyledChainSelectionIconWidget } from "./StyleComponents/StyledChainSelectionIconWidget"
import { SelectedChainLogoAndText } from "./SelectedChainLogoAndText"
import { Chains, enableChains } from "config/consts";
import SwapChains from "components/CompositeComponents/SwapChains"
// import { getAssetSymbolToShow } from "utils/getAssetSymbolToShow"

interface IChainSelectorProps {
  id: string
  label: string
  animate?: boolean
  hideContents?: boolean
  ref: any
  closeOtherWindow: () => void
}

const ChainSelector = React.forwardRef((props: IChainSelectorProps, ref) => {
  const isSourceChain: boolean = props.id === SOURCE_TOKEN_KEY
  const [selectedChain, setSelectedChain] = useRecoilState<ChainInfo | null>(
    ChainSelection(props.id)
  )
  const sourceChain = useRecoilValue<ChainInfo | null>(
    ChainSelection(SOURCE_TOKEN_KEY)
  )
  const chainList = useRecoilValue(ChainList)
  const sourceAsset = useRecoilValue(SourceAsset)
  // const resetSourceAsset = useResetRecoilState(SourceAsset)
  // const [showAssetSearchBox, setShowAssetSearchBox] = useState<boolean>(false)
  const [showChainSelectorSearchBox, setShowChainSelectorSearchBox] =
    useState<boolean>(false)

  /*closeAllSearchWindows is a ref method called
  from the parent component (UserInputWindow/index.tsx)
  to programmatically close the asset search windows */
  useImperativeHandle(ref, () => ({
    closeAllSearchWindows() {
      setShowChainSelectorSearchBox(false)
      // setShowAssetSearchBox(false)
    },
  }))

  let filteredChainList: ChainInfo[] = chainList
    .filter((chain: ChainInfo) => {
      return enableChains.includes(chain.chainSymbol as Chains)
      // chain.chainInfo.chainName?.toLowerCase() !== "injective"
    })

  /*for the destination chain, if source chain and source asset are selected,
   * only enable chains which also have that asset, based on common_key
   * */
  if (!!sourceChain && !!sourceAsset && !isSourceChain && !sourceAsset.isIBCToken) {
    filteredChainList = filteredChainList.filter((supportedChain) => {
      const assetsInSupportedChain: AssetInfo[] = supportedChain.assets || []
      return assetsInSupportedChain
        .map((asset) => asset.common_key)
        .includes(sourceAsset.common_key)
    })
  }
  const chainDropdownOptions: ISearchItem[] = filteredChainList.map(
    (supportedChain: ChainInfo) => ({
      title: supportedChain?.chainName?.toLowerCase() === "terra" ? "Terra 2.0" : supportedChain.chainName,  //TODO: Terra 2.0 is temporary
      active: false,
      icon: require(`assets/svg/logos/${supportedChain?.chainSymbol}.svg`)
        ?.default,
      disabled: false,
      onClick: () => {
        setSelectedChain(supportedChain)

        /* if the selected chain is the source token and the chain only
      has a single asset, select that asset */
        // if (isSourceChain) {
        //   supportedChain?.assets?.length === 1
        //     ? setSourceAsset(supportedChain.assets[0])
        //     : resetSourceAsset()
        // }
      },
    })
  )

  /*only show the chain selector widget if the asset selector search box is not open*/
  const chainSelectorWidget = () => {
    const onClick = () => {
      props.closeOtherWindow()
      /*if you're about to toggle open the chain selector search box
       * and the asset search box is already open, close the asset search box first */
      // if (!showChainSelectorSearchBox && showAssetSearchBox)
      //   setShowAssetSearchBox(false)
      setShowChainSelectorSearchBox(!showChainSelectorSearchBox)
    }
    return (
      <>
        {
          !showChainSelectorSearchBox ?
            <StyledChainSelectionIconWidget onClick={onClick} style={{ cursor: `pointer` }
            } >
              <div>
                <SelectedChainLogoAndText chainInfo={selectedChain} />
              </div>
              <SVGImage
                src={
                  require(showChainSelectorSearchBox
                    ? `assets/svg/drop-up-arrow.svg`
                    : `assets/svg/drop-down-arrow.svg`)?.default
                }
                height={"0.75em"}
                width={"0.75em"}
              />
            </StyledChainSelectionIconWidget > :
            <ActiveStyledChainSelectionIconWidget onClick={onClick} style={{ cursor: `pointer` }}>
              <div>
                <SelectedChainLogoAndText chainInfo={selectedChain} />
              </div>
              <SVGImage
                src={
                  require(showChainSelectorSearchBox
                    ? `assets/svg/drop-up-arrow.svg`
                    : `assets/svg/drop-down-arrow.svg`)?.default
                }
                height={"0.75em"}
                width={"0.75em"}
              />
            </ActiveStyledChainSelectionIconWidget>
        }
      </>
    )
  }

  /*only show the asset selector widget if the chain selector search box is not open*/
  // const assetSelectorWidget = (shouldHide: boolean) => {
  //   const onClick = () => {
  //     props.closeOtherWindow()
  //     /*if you're about to toggle open the asset selector search box
  //      * and the chain search box is already open, close the chain search box first */
  //     if (!showAssetSearchBox && showChainSelectorSearchBox)
  //       setShowChainSelectorSearchBox(false)
  //     setShowAssetSearchBox(!showAssetSearchBox)
  //   }
  //   return (
  //     <StyledChainSelectionIconWidget hide={shouldHide}>
  //       <div style={{ cursor: `pointer` }} onClick={onClick}>
  //         <AssetSelector />
  //       </div>
  //       <SVGImage
  //         style={{ cursor: `pointer` }}
  //         onClick={onClick}
  //         src={
  //           require(showAssetSearchBox
  //             ? `assets/svg/drop-up-arrow.svg`
  //             : `assets/svg/drop-down-arrow.svg`)?.default
  //         }
  //         height={"0.75em"}
  //         width={"0.75em"}
  //       />
  //     </StyledChainSelectionIconWidget>
  //   )
  // }

  return (
    <StyledChainSelectionComponent>
      <div style={{ margin: `20px 0px 10px`, color: `#898994`, fontSize: `0.9em`, display: 'flex', alignItems: 'center' }}>
        {props.label}
        <SwapChains />
      </div>
      <FlexSpaceBetween style={{ width: `100%`, marginRight: `5px` }}>
        {chainSelectorWidget()}
        {/* {isSourceChain ? assetSelectorWidget(!sourceChain) : <></>} */}
      </FlexSpaceBetween>

      {/*search dropdown for chain selection*/}
      <SearchComponent
        show={showChainSelectorSearchBox}
        allItems={chainDropdownOptions}
        handleClose={() => setShowChainSelectorSearchBox(false)}
      />
    </StyledChainSelectionComponent>
  )
})

export default ChainSelector
