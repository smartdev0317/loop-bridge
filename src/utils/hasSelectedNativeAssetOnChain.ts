import { AssetInfo } from "config/consts"
import { nativeAssetMap } from "config/contracts/deployedContractAddresses"

export const hasSelectedNativeAssetForChain = (
  assetInfo: AssetInfo,
  sourceChainName?: string
): boolean => {
  if (!assetInfo || !sourceChainName) return false
  const env = process.env.REACT_APP_STAGE === "mainnet" ? "mainnet" : "testnet"
  return (
    nativeAssetMap[env][sourceChainName?.toLowerCase() || ""] ===
    assetInfo.common_key
  )
}
