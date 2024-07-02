import React, { useState } from "react"
import { ethers } from "ethers"
import styled from "styled-components"
import { AssetInfo } from "@axelar-network/axelarjs-sdk"
import { useRecoilState, useRecoilValue } from "recoil"
import { SendLogsToServer } from "api/SendLogsToServer"
import { Chains, DESTINATION_TOKEN_KEY, ibcChainId, ibcChannels, ROUTE_TOKEN_KEY, SOURCE_TOKEN_KEY } from "config/consts"
import { InputForm } from "components/CompositeComponents/InputForm"
import { StyledButton } from "components/StyleComponents/StyledButton"
import { FlexRow } from "components/StyleComponents/FlexRow"
import { ChainSelection, DestinationAddress, SourceAsset } from "state/ChainSelection"
import {
  SrcChainDepositTxHash,
  RouteChainDepositTxHash,
  TransactionTraceId,
  DepositAmount,
  DepositTimestamp,
  HasEnoughDepositConfirmation,
  DepositMadeInApp,
} from "state/TransactionStatus"
import { isValidDecimal } from "utils/isValidDecimal"
import { AXELAR_TRANSFER_GAS_LIMIT, TERRA_IBC_GAS_LIMIT } from "config/gas"
import LoadingWidget from "components/Widgets/LoadingWidget"
import { getShortenedWord } from "utils/wordShortener"
import BoldSpan from "components/StyleComponents/BoldSpan"
import { FlexColumn } from "components/StyleComponents/FlexColumn"
import { getNumber } from "utils/formatNumber"
import decimaljs from "decimal.js"
import keplrService from "./keplrService"
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js'

const TransferButton = styled(StyledButton)`
  color: ${(props) => (props.dim ? "#565656" : "white")};
  height: 2em;
  cursor: ${(props) => (props.dim ? "not-allowed" : "pointer")};
  font-size: 0.9em;
  margin: 0.5em 0em 0em -1em;
`

interface DepositFromWalletProps {
  isWalletConnected: boolean
  walletBalance: number
  reloadBalance: () => void
  walletAddress: string
  depositAddress: AssetInfo
}
export const DepositFromWallet = ({
  isWalletConnected,
  walletBalance,
  walletAddress,
  depositAddress,
  reloadBalance,
}: DepositFromWalletProps) => {
  const sourceChainSelection = useRecoilValue(ChainSelection(SOURCE_TOKEN_KEY))
  const routeChainSelection = useRecoilValue(ChainSelection(ROUTE_TOKEN_KEY))
  const destChainSelection = useRecoilValue(
    ChainSelection(DESTINATION_TOKEN_KEY)
  )
  const selectedSourceAsset = useRecoilValue(SourceAsset)
  const [amountToDeposit, setAmountToDeposit] = useState<string>("")
  const [, setDepositAmount] = useRecoilState(DepositAmount)
  const [buttonText, setButtonText] = useState("Send")
  const [sentSuccess, setSentSuccess] = useState(false)
  const [hasEnoughDepositConfirmation, setHasEnoughDepositConfirmation] =
    useRecoilState(HasEnoughDepositConfirmation)
  const [, setTxHash] = useRecoilState(SrcChainDepositTxHash)
  const [, setRouteTxHash] = useRecoilState(RouteChainDepositTxHash)
  const [, setDepositTimestamp] = useRecoilState(DepositTimestamp)
  const transactionTraceId = useRecoilValue(TransactionTraceId)
  const [inputHasChanged, setInputHasChanged] = useState(false)
  const [, setDepositMadeInApp] =
    useRecoilState(DepositMadeInApp)
  const destinationAddress = useRecoilValue(DestinationAddress)

  const transferKeplr = async () => {

    if (!sourceChainSelection?.chainName) return

    setButtonText("Sending...")

    try {
      let sourceSigner, sourceAddress
      if (sourceChainSelection) {
        const sourceService = await keplrService.connect(sourceChainSelection)
        if (sourceService) {
          sourceAddress = sourceService.address
          sourceSigner = sourceService.signingCosmosClient
        }
      }
      let routeSigner, routeAddress
      if (routeChainSelection) {
        const routeService = await keplrService.connect(routeChainSelection)
        routeAddress = routeService?.address
        routeSigner = routeService?.signingCosmosClient
      }
      if (!sourceSigner || !sourceAddress) return

      const block = await sourceSigner?.getBlock()
      if (!block) return
      const sourceChannel = routeChainSelection
        ? ibcChannels[sourceChainSelection.chainSymbol as Chains][routeChainSelection.chainSymbol as Chains].sourceChannel
        : ibcChannels[sourceChainSelection.chainSymbol as Chains][destChainSelection?.chainSymbol as Chains].sourceChannel
      const receiver = routeChainSelection ? routeAddress : destinationAddress
      const denom = selectedSourceAsset?.ibcDenom
      const sendAmount = (Number(amountToDeposit) * Math.pow(10, selectedSourceAsset?.decimals || 0)).toFixed()
      const transferMsg = {
        typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
        value: {
          sourcePort: 'transfer',
          sourceChannel: sourceChannel,
          sender: sourceAddress,
          receiver: receiver,
          token: { denom: denom, amount: sendAmount },
          timeoutHeight: undefined,
          timeoutTimestamp: (Date.parse(block.header.time) + 150 * 1000).toString() + "000000"
        },
      }
      setDepositAmount(amountToDeposit)
      let account = await sourceSigner.getSequence(sourceAddress)
      const sourceTx = await sourceSigner.sign(
        sourceAddress,
        [transferMsg],
        {
          amount: [],
          gas: '150000',
        },
        '', // memo
        {
          chainId: ibcChainId[sourceChainSelection.chainSymbol as Chains],
          accountNumber: account.accountNumber,
          sequence: account.sequence,
        }
      )

      if (routeChainSelection) {
        if (!routeSigner || !routeAddress) return
        const block1 = await routeSigner?.getBlock()
        if (!block1) return
        const routeChannel = ibcChannels[routeChainSelection.chainSymbol as Chains][destChainSelection?.chainSymbol as Chains].sourceChannel
        const receiver1 = destinationAddress
        const denom1 = selectedSourceAsset?.tokenAddress
        const transferMsg1 = {
          typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
          value: {
            sourcePort: 'transfer',
            sourceChannel: routeChannel,
            sender: routeAddress,
            receiver: receiver1,
            token: { denom: denom1, amount: sendAmount },
            timeoutHeight: undefined,
            timeoutTimestamp: (Date.parse(block1.header.time) + 300 * 1000).toString() + "000000",
          },
        }
        let account1 = await routeSigner.getSequence(routeAddress)

        const routeTx = await routeSigner.sign(
          routeAddress,
          [transferMsg1],
          {
            amount: [],
            gas: '150000',
          },
          '', // memo
          {
            chainId: ibcChainId[routeChainSelection.chainSymbol as Chains],
            accountNumber: account1.accountNumber,
            sequence: account1.sequence,
          }
        )
        const sourceTxResult = await sourceSigner.broadcastTx(
          TxRaw.encode(sourceTx).finish()
        )
        // handleKeplrTxResult(sourceTxResult)
        const routeTxResult = await routeSigner.broadcastTx(
          TxRaw.encode(routeTx).finish()
        )
        handleKeplrTxResult(sourceTxResult, routeTxResult)
      } else {
        const sourceTxResult = await sourceSigner.broadcastTx(
          TxRaw.encode(sourceTx).finish()
        )
        handleKeplrTxResult(sourceTxResult)
      }
    } catch (error: any) {
      setDepositAmount("")
      const results = error
      handleKeplrTxResult(results)
    }
  }

  const handleKeplrTxResult = (results: any, routeResults?: any) => {
    // this is the case where you get immediate feedback in the results
    let stringifiedResults: string = results?.toString()?.toLowerCase() || ""

    // this is the case where the request is sent to the network and raw logs are returned, so we also want to check this for any of the below issues
    if (results?.rawLog) {
      stringifiedResults += results.rawLog.toString()
    }
    const outOfGas: boolean = stringifiedResults.includes("out of gas")
    const accountSequenceMismatch: boolean = stringifiedResults.includes(
      "account sequence mismatch"
    )
    const inSufficientFunds: boolean =
      stringifiedResults.includes("insufficient funds")
    const requestRejected: boolean =
      stringifiedResults.includes("request rejected")

    const hasAnyErrors =
      outOfGas ||
      accountSequenceMismatch ||
      inSufficientFunds ||
      requestRejected

    //TODO: temporary workaround for crescent RPC issues we see for in-app deposits
    if (sourceChainSelection?.chainName.toLowerCase() === "crescent" && stringifiedResults.includes("transaction indexing is disabled")) {
      setSentSuccess(true)
      setTxHash("")
      setHasEnoughDepositConfirmation(true)
      setDepositTimestamp(new Date().getTime())

    } else if (
      results &&
      (results.transactionHash || results.txhash) &&
      results.height >= 0 &&
      !hasAnyErrors
    ) {
      setSentSuccess(true)
      setTxHash(results.transactionHash || results.txhash)
      setRouteTxHash(routeResults.transactionHash || routeResults.txHash)
      setDepositMadeInApp(true)
      setHasEnoughDepositConfirmation(true)
      setDepositTimestamp(new Date().getTime())
      SendLogsToServer.info(
        "DEPOSIT_CONFIRMATION",
        "deposit made within app: " + results,
        transactionTraceId
      )
    } else {
      setButtonText("Hmm, try again")
      const msg = "user failed to send tx: " + results
      SendLogsToServer.info("DEPOSIT_CONFIRMATION", msg, transactionTraceId)
    }
  }

  const transfer = async () => {
    await transferKeplr()
  }

  const handleMaxClick = () => {
    const highGasPrice = 0.2
    if (
      sourceChainSelection?.chainName?.toLowerCase() === "terra" &&
      selectedSourceAsset?.common_key === "uluna"
    ) {
      const fee = parseFloat(
        ethers.utils.formatUnits(
          highGasPrice * parseInt(TERRA_IBC_GAS_LIMIT),
          selectedSourceAsset?.decimals || 6
        )
      )
      const maxWithFee = walletBalance - fee
      const roundedMax = (Math.floor(maxWithFee * 100) / 100).toFixed(2)
      setAmountToDeposit(roundedMax)
    } else if (
      sourceChainSelection?.chainName?.toLowerCase() === "axelar" &&
      selectedSourceAsset?.common_key === "uaxl"
    ) {
      const fee = parseFloat(
        ethers.utils.formatUnits(
          highGasPrice * parseInt(AXELAR_TRANSFER_GAS_LIMIT),
          selectedSourceAsset?.decimals || 6
        )
      )
      const maxWithFee = walletBalance - fee
      const roundedMax = (Math.floor(maxWithFee * 10000) / 10000)
      setAmountToDeposit(new decimaljs(roundedMax).toString())
    } else {
      const roundedMax = (Math.floor(walletBalance * 10000) / 10000)
      setAmountToDeposit(new decimaljs(roundedMax).toString())
    }
  }
  const getMaxButtonText = () => {
    return "max"
  }

  if (sentSuccess) {
    return sourceChainSelection?.module === "evm" &&
      !hasEnoughDepositConfirmation ? (
      <div>
        Waiting transaction on {routeChainSelection?.chainName}...
      </div>
    ) : null
  }

  const disableTransferButton: boolean =
    !amountToDeposit ||
    isNaN(parseFloat(amountToDeposit)) ||
    parseFloat(amountToDeposit) > walletBalance ||
    !isValidDecimal(amountToDeposit.toString()) ||
    (buttonText || "").toLowerCase().includes("sending")

  const getDisabledText = (disableTransferButton: boolean) => {
    let text = ""

    if (
      (amountToDeposit && parseFloat(amountToDeposit) > walletBalance)
    )
      text = "Insufficient funds"
    else if (!amountToDeposit) return <br />
    else if (!isValidDecimal(amountToDeposit.toString()))
      text = "Too many decimal points"

    return text.length > 0 ? <div style={{ width: `98%` }}>{text}</div> : <br />
  }

  return isWalletConnected ? (
    <FlexColumn>
      <FlexRow style={{ justifyContent: `flex-start`, width: `95%` }}>
        <FlexColumn>
          <div
            style={{
              width: `100%`,
              position: `relative`,
              marginRight: `1em`,
            }}
          >
            <InputForm
              name={"destination-address-input"}
              value={
                amountToDeposit
                  ?.replace(/[^.0-9]/g, "") || ""
                // ?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "" //TODO: want the thousands separator but need to get this working for small decimals
              }
              placeholder={"Amount"}
              type={"text"}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAmountToDeposit(e.target.value?.replace(/,/g, ""))
                if (!inputHasChanged) setInputHasChanged(true)
              }}
            />
            {walletBalance > 0 && (
              <div
                style={{
                  position: `absolute`,
                  color: "grey",
                  right: `0.5em`,
                  bottom: `0.25em`,
                  fontSize: `0.8em`,
                  cursor: "pointer",
                }}
                onClick={handleMaxClick}
              >
                {getMaxButtonText()}
              </div>
            )}
          </div>
          <TransferButton
            dim={disableTransferButton}
            disabled={disableTransferButton}
            onClick={transfer}
          >
            {buttonText}
          </TransferButton>
        </FlexColumn>
        <FlexColumn
          style={{
            alignItems: `flex-start`,
            fontSize: `0.8em`,
            border: `1px solid lightgrey`,
            borderRadius: `5px`,
            display: `flex`,
            boxSizing: `border-box`,
            padding: `0.5em`,
            margin: `0em -0.5em 0em 0.5em`,
            width: `70%`,
          }}
        >
          <span style={{ marginBottom: `0.5em` }}>
            Wallet: <BoldSpan>{getShortenedWord(walletAddress)}</BoldSpan>
          </span>
          <span style={{ marginBottom: `0.5em` }}>
            Balance: <BoldSpan>~{getNumber(walletBalance, selectedSourceAsset?.decimals)} </BoldSpan>
            <LoadingWidget cb={reloadBalance} />
          </span>
        </FlexColumn>
      </FlexRow>
      {inputHasChanged ? getDisabledText(disableTransferButton) : <br />}
    </FlexColumn>
  ) : null
}
