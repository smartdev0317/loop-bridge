import { SigningStargateClient, StargateClient } from '@cosmjs/stargate'
import { ChainInfo, ibcChainId, IbcNetwork, ibcRpc } from 'config/consts'
import _ from 'lodash'

declare const window: Window &
  typeof globalThis & {
    keplr: any
  }

const checkInstalled = (): boolean => {
  return _.some(window.keplr)
}

const installWallet = (): void => {
  const confirm = window.confirm(
    "Click OK to be brought to the Chrome Store to download the Keplr Wallet. Please ensure your Keplr account is set up before returning to Satellite."
  )
  if (confirm) {
    window.open(
      "https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap?hl=en",
      "_blank"
    )
  }
}

const connect = async (
  chain: ChainInfo
): Promise<{
  address: string
  signingCosmosClient: SigningStargateClient
} | undefined> => {
  const keplr = window.keplr
  const CHAIN_ID = ibcChainId[chain.chainSymbol as IbcNetwork]

  if (!keplr) {
    installWallet()
    return undefined
  }

  await keplr.enable(CHAIN_ID)
  const keplrOfflineSigner = await keplr.getOfflineSigner(CHAIN_ID)
  const accounts = await keplrOfflineSigner.getAccounts()
  const address = accounts[0].address

  const signingCosmosClient = await SigningStargateClient.connectWithSigner(
    ibcRpc[chain.chainSymbol as IbcNetwork],
    keplrOfflineSigner
  )

  // @ts-expect-error
  signingCosmosClient.chainId = CHAIN_ID

  return { address, signingCosmosClient }
}

const data = { connect, checkInstalled }

export default data
