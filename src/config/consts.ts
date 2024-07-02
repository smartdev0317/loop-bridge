export const SOURCE_TOKEN_KEY: string = "first-chain-selection"
export const DESTINATION_TOKEN_KEY: string = "second-chain-selection"
export const ROUTE_TOKEN_KEY: string = "route-chain-selection"
export const MS_UNTIL_CONFIRM_BTN_VISIBLE: number = parseInt(
  process.env.REACT_APP_MS_UNTIL_CONFIRM_BTN_VISIBLE ||
  (5 * 60 * 1000).toString()
) // 5 mins

export interface AssetInfo {
  assetSymbol?: string;
  assetName?: string;
  assetAddress?: string;
  common_key?: string;
  fullDenomPath?: string;
  fullySupported?: boolean;
  native_chain?: string;
  minDepositAmt?: number;
  decimals?: number;
  ibcDenom?: string;
  tokenAddress?: string;
  isIBCToken?: boolean;
}

export interface ChainInfo {
  assets?: AssetInfo[];
  chainSymbol: string;
  chainName: string;
  fullySupported: boolean;
  estimatedWaitTime: number;
  txFeeInPercent: number;
  module: "axelarnet" | "evm" | "ibc";
  confirmLevel?: number;
  chainIdentifier: {
    devnet: string;
    testnet: string;
    mainnet: string;
  };
}

export const axelarAssets = [
  "axlusdc",
  "axlwbtc",
  "axlweth"
]

export enum Chains {
  OSMOSIS = "OSMO",
  JUNO = "JUNO",
  SECRET = "SCRT",
  COSMOS = "ATOM"
}

export type IbcNetwork = Chains.OSMOSIS | Chains.JUNO | Chains.SECRET | Chains.COSMOS

export const ibcChains: ChainInfo[] = [
  {
    chainName: "Cosmoshub",
    chainSymbol: "ATOM",
    fullySupported: true,
    estimatedWaitTime: 0,
    txFeeInPercent: 0,
    module: "ibc",
    chainIdentifier: {
      devnet: "cosmoshub",
      mainnet: "cosmoshub",
      testnet: "cosmoshub",
    },
  },
  {
    chainName: "Osmosis",
    chainSymbol: "OSMO",
    fullySupported: true,
    estimatedWaitTime: 0,
    txFeeInPercent: 0,
    module: "ibc",
    chainIdentifier: {
      devnet: "osmosis",
      mainnet: "osmosis",
      testnet: "osmosis",
    },
  },
  {
    chainName: "Juno",
    chainSymbol: "JUNO",
    fullySupported: true,
    estimatedWaitTime: 0,
    txFeeInPercent: 0,
    module: "ibc",
    chainIdentifier: {
      devnet: "juno",
      mainnet: "juno",
      testnet: "juno",
    },
  },
  {
    chainName: "Secret",
    chainSymbol: "SCRT",
    fullySupported: true,
    estimatedWaitTime: 0,
    txFeeInPercent: 0,
    module: "ibc",
    chainIdentifier: {
      devnet: "secret",
      mainnet: "secret",
      testnet: "secret",
    },
  },
]

export const enableChains = [
  Chains.OSMOSIS,
  Chains.JUNO
]

export const ibcAssets: Record<string, AssetInfo[]> = {
  [Chains.OSMOSIS]: [
    {
      assetName: "ATOM",
      assetSymbol: "ATOM",
      native_chain: "cosmoshub",
      tokenAddress: "uatom",
      common_key: "uatom",
      ibcDenom: "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
      decimals: 6,
      fullySupported: true,
      isIBCToken: true,
    },
    {
      assetName: "OSMO",
      assetSymbol: "OSMO",
      native_chain: "osmosis",
      tokenAddress: "uosmo",
      common_key: "uosmo",
      ibcDenom: "uosmo",
      decimals: 6,
      fullySupported: true,
      isIBCToken: true,
    },
    {
      assetName: "JUNO",
      assetSymbol: "JUNO",
      native_chain: "juno",
      tokenAddress: "ujuno",
      common_key: "ujuno",
      ibcDenom: "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
      decimals: 6,
      fullySupported: true,
      isIBCToken: true,
    },
    {
      assetName: "SCRT",
      assetSymbol: "SCRT",
      native_chain: "secret",
      tokenAddress: "uscrt",
      common_key: "uscrt",
      ibcDenom: "ibc/0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A",
      decimals: 6,
      fullySupported: true,
      isIBCToken: true,
    }
  ],
  [Chains.JUNO]: [
    {
      assetName: "ATOM",
      assetSymbol: "ATOM",
      native_chain: "cosmoshub",
      tokenAddress: "uatom",
      common_key: "uatom",
      ibcDenom: "ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9",
      decimals: 6,
      fullySupported: true,
      isIBCToken: true,
    },
    {
      assetName: "OSMO",
      assetSymbol: "OSMO",
      native_chain: "osmosis",
      tokenAddress: "uosmo",
      common_key: "uosmo",
      ibcDenom: "ibc/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518",
      decimals: 6,
      fullySupported: true,
      isIBCToken: true,
    },
    {
      assetName: "JUNO",
      assetSymbol: "JUNO",
      native_chain: "juno",
      tokenAddress: "ujuno",
      common_key: "ujuno",
      ibcDenom: "ujuno",
      decimals: 6,
      fullySupported: true,
      isIBCToken: true,
    },
    {
      assetName: "SCRT",
      assetSymbol: "SCRT",
      native_chain: "secret",
      tokenAddress: "uscrt",
      common_key: "uscrt",
      ibcDenom: "ibc/B55B08EF3667B0C6F029C2CC9CAA6B00788CF639EBB84B34818C85CBABA33ABD",
      decimals: 6,
      fullySupported: true,
      isIBCToken: true,
    }
  ]
}

export const ibcChannels: Record<Chains, any> = {
  [Chains.JUNO]: {
    [Chains.OSMOSIS]: {
      sourceChannel: 'channel-0',
      destinationChannel: 'channel-42',
    },
    [Chains.SECRET]: {
      sourceChannel: 'channel-48',
      destinationChannel: 'channel-8',
    },
    [Chains.COSMOS]: {
      sourceChannel: 'channel-1',
      destinationChannel: 'channel-207',
    },
  },
  [Chains.OSMOSIS]: {
    [Chains.JUNO]: {
      sourceChannel: 'channel-42',
      destinationChannel: 'channel-0',
    },
    [Chains.SECRET]: {
      sourceChannel: 'channel-88',
      destinationChannel: 'channel-1',
    },
    [Chains.COSMOS]: {
      sourceChannel: 'channel-0',
      destinationChannel: 'channel-141',
    },
  },
  [Chains.COSMOS]: {
    [Chains.JUNO]: {
      sourceChannel: 'channel-207',
      destinationChannel: 'channel-1',
    },
    [Chains.OSMOSIS]: {
      sourceChannel: 'channel-141',
      destinationChannel: 'channel-0',
    },
  },
  [Chains.SECRET]: {
    [Chains.JUNO]: {
      sourceChannel: 'channel-8',
      destinationChannel: 'channel-48',

    },
    [Chains.OSMOSIS]: {
      sourceChannel: 'channel-1',
      destinationChannel: 'channel-88',
    }
  }
}

export const ibcChainId: Record<Chains, string> = {
  [Chains.OSMOSIS]: 'osmosis-1',
  [Chains.SECRET]: 'secret-4',
  [Chains.COSMOS]: 'cosmoshub-4',
  [Chains.JUNO]: 'juno-1',
}


export const ibcRpc: Record<IbcNetwork, string> = {
  [Chains.OSMOSIS]: 'https://rpc-osmosis.blockapsis.com/',
  // [Chains.OSMOSIS]: 'https://rpc-osmosis-ia.notional.ventures/',
  // [Chains.OSMOSIS]: 'https://rpc-osmosis.keplr.app',
  [Chains.SECRET]: 'https://lcd-secret.scrtlabs.com/rpc/',
  // [Chains.SECRET]: 'https://rpc-secret.keplr.app',
  // [Chains.COSMOS]: 'https://rpc-cosmoshub.blockapsis.com/',
  // [Chains.COSMOS]: 'https://rpc-cosmoshub.keplr.app',
  [Chains.COSMOS]: 'https://rpc.cosmoshub.pupmos.network',
  // [Chains.COSMOS]: 'https://rpc-cosmoshub.whispernode.com',
  // [Chains.JUNO]: 'https://rpc-juno.whispernode.com',
  // [Chains.JUNO]: 'https://rpc-juno.keplr.app',
  [Chains.JUNO]: 'https://rpc.juno.omniflix.co/',
}