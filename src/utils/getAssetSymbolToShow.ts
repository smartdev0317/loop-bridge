import { AssetInfo, ChainInfo } from "config/consts";

export function getAssetSymbolToShow(sourceChain: ChainInfo, destChain: ChainInfo, selectedToken: AssetInfo, alternative: any) {
    return selectedToken?.isIBCToken
        ? selectedToken.assetSymbol
        : (sourceChain?.module === "axelarnet" && selectedToken?.native_chain === destChain?.chainName?.toLowerCase()
            ? destChain?.assets?.find(asset => asset.common_key === selectedToken.common_key)?.assetName || ""
            : alternative)
}