import styled from "styled-components"
import screenConfigs from "config/screenConfigs"
import { opacityAnimation } from "components/StyleComponents/animations/OpacityAnimation"
import { FlexRow } from "components/StyleComponents/FlexRow"
import { StyledCloseButton } from "components/StyleComponents/StyledButton"
import { SelectedChainLogoAndText } from "components/CompositeComponents/Selectors/ChainSelector/SelectedChainLogoAndText"
import { useRecoilValue, useRecoilState, useSetRecoilState } from "recoil"
import {
    ChainSelection,
    DestinationAddress,
    SourceAsset,
} from "state/ChainSelection"
import {
    SrcChainDepositTxHash,
    RouteChainDepositTxHash,
    TransactionTraceId,
    DepositAmount,
    DepositTimestamp,
    HasEnoughDepositConfirmation,
    DepositMadeInApp,
    SrcChainDepositTxResult,
    RouteChainDepositTxResult,
} from "state/TransactionStatus"
import { Chains, DESTINATION_TOKEN_KEY, SOURCE_TOKEN_KEY, ROUTE_TOKEN_KEY, ibcChannels, ibcChainId } from "config/consts"
import { SVGImage } from "components/Widgets/SVGImage"
import UTIL from "utils/util"
import StyledButtonContainer from "../StyledComponents/StyledButtonContainer"
import StyledButton from "../StyledComponents/StyledButton"
import { useState } from "react"
import keplrService from "./keplrService"
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js'
// import { SendLogsToServer } from "api/SendLogsToServer"
import ValidationErrorWidget from "components/Widgets/ValidationErrorWidget"
import { ShowIBCTransactionStatusWindow, ShowSendIBCTransactionWindow } from "state/ApplicationStatus"
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx"

interface ITransactionStatusWindowProps {
    isOpen: boolean
    closeResultsScreen: any
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

const SendIBCTransactionWindow = ({
    isOpen,
    closeResultsScreen,
}: ITransactionStatusWindowProps) => {

    const [buttonText, setButtonText] = useState("Confirm")
    const [sentSuccess, setSentSuccess] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [isSending, setIsSending] = useState(false)
    const sourceChainSelection = useRecoilValue(ChainSelection(SOURCE_TOKEN_KEY))
    const destChainSelection = useRecoilValue(ChainSelection(DESTINATION_TOKEN_KEY))
    const routeChainSelection = useRecoilValue(ChainSelection(ROUTE_TOKEN_KEY))
    const selectedToken = useRecoilValue(SourceAsset)
    const destAddr = useRecoilValue(DestinationAddress)
    const depositAmount = useRecoilValue(DepositAmount)
    // const transactionTraceId = useRecoilValue(TransactionTraceId)
    // const [hasEnoughDepositConfirmation, setHasEnoughDepositConfirmation] = useRecoilState(HasEnoughDepositConfirmation)
    const setDepositTimestamp = useSetRecoilState(DepositTimestamp)
    const setTxHash = useSetRecoilState(SrcChainDepositTxHash)
    const setRouteTxHash = useSetRecoilState(RouteChainDepositTxHash)
    const setSourceTxResult = useSetRecoilState(SrcChainDepositTxResult)
    const setRouteTxResult = useSetRecoilState(RouteChainDepositTxResult)
    const setShowSendIBCTransactionWindow = useSetRecoilState(ShowSendIBCTransactionWindow)
    const setShowIBCTransactionStatusWindow = useSetRecoilState(ShowIBCTransactionStatusWindow)
    // const setDepositMadeInApp = useSetRecoilState(DepositMadeInApp)

    let assetImage

    try {
        assetImage =
            require(`assets/svg/tokenAssets/${selectedToken?.common_key}.svg`)?.default
    } catch (e) {
        assetImage = require(`assets/svg/select-asset-eyes.svg`)?.default
    }

    const sendToken = async () => {
        if (isSending) return
        if (sentSuccess) {
            closeResultsScreen()
        }
        if (!sourceChainSelection?.chainName) return
        setErrorMsg("")

        setButtonText("Sending...")
        setIsSending(true)

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
            if (!sourceSigner || !sourceAddress) {
                setIsSending(false)
                setErrorMsg("Something error")
                return
            }
            const block = await sourceSigner?.getBlock()
            if (!block) {
                setIsSending(false)
                setErrorMsg("Network error")
                return
            }
            const sourceChannel = routeChainSelection
                ? ibcChannels[sourceChainSelection.chainSymbol as Chains][routeChainSelection.chainSymbol as Chains].sourceChannel
                : ibcChannels[sourceChainSelection.chainSymbol as Chains][destChainSelection?.chainSymbol as Chains].sourceChannel
            const receiver = routeChainSelection ? routeAddress : destAddr
            const denom = selectedToken?.ibcDenom
            const sendAmount = (Number(depositAmount) * Math.pow(10, selectedToken?.decimals || 0)).toFixed()
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
                if (!routeSigner || !routeAddress) {
                    setIsSending(false)
                    setErrorMsg("Something error")
                    return
                }
                const block1 = await routeSigner?.getBlock()
                if (!block1) {
                    setIsSending(false)
                    setErrorMsg("Network error")
                    return
                }
                const routeChannel = ibcChannels[routeChainSelection.chainSymbol as Chains][destChainSelection?.chainSymbol as Chains].sourceChannel
                const receiver1 = destAddr
                const denom1 = selectedToken?.tokenAddress
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
                const routeTxResult = await routeSigner.broadcastTx(
                    TxRaw.encode(routeTx).finish()
                )
                setTxHash(sourceTxResult?.transactionHash)
                setRouteTxHash(routeTxResult?.transactionHash)
                setSourceTxResult(await sourceSigner.getTx(sourceTxResult.transactionHash))
                setRouteTxResult(await routeSigner.getTx(routeTxResult.transactionHash))
                setShowSendIBCTransactionWindow(false)
                setShowIBCTransactionStatusWindow(true)
            } else {
                const sourceTxResult = await sourceSigner.broadcastTx(
                    TxRaw.encode(sourceTx).finish()
                )
                setSourceTxResult(sourceTxResult)
                setShowSendIBCTransactionWindow(false)
                setShowIBCTransactionStatusWindow(true)
            }
        } catch (error: any) {
            const results = error
            handleKeplrTxResult(results)
            setIsSending(false)
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
            // setHasEnoughDepositConfirmation(true)
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
            // setDepositMadeInApp(true)
            // setHasEnoughDepositConfirmation(true)
            // setDepositTimestamp(new Date().getTime())
            // SendLogsToServer.info(
            //     "DEPOSIT_CONFIRMATION",
            //     "deposit made within app: " + results,
            //     transactionTraceId
            // )
        } else {
            setButtonText("Try again")
            const msg = "user failed to send tx: " + results
            setErrorMsg(msg)
            // SendLogsToServer.info("DEPOSIT_CONFIRMATION", msg, transactionTraceId)
        }
    }

    return (
        <StyledTransactionStatusWindow>
            <StyledCloseButton onClick={closeResultsScreen}>
                <i className="fa fa-angle-left"></i>
            </StyledCloseButton>
            <FlexRow
                style={{
                    color: "white"
                }}
            >
                <h2>Confirm</h2>
            </FlexRow>
            <br />
            <FlexRow
                style={{
                    justifyContent: `space-between`,
                }}
            >
                <div style={{ margin: `15px 0px`, color: `#898994`, fontSize: `0.9em`, display: 'flex', alignItems: 'center' }}>
                    FROM
                </div>
                <SelectedChainLogoAndText chainInfo={sourceChainSelection} />
            </FlexRow>
            <FlexRow
                style={{
                    justifyContent: `space-between`,
                }}
            >
                <div style={{ margin: `15px 0px`, color: `#898994`, fontSize: `0.9em`, display: 'flex', alignItems: 'center' }}>
                    TO
                </div>
                <SelectedChainLogoAndText chainInfo={destChainSelection} />
            </FlexRow>
            <br />
            <br />
            <FlexRow
                style={{
                    justifyContent: `space-between`,
                    borderBottom: `1px solid #2e2e2e`,
                    marginTop: '10px',
                    marginBottom: '10px'
                }}
            >
                <div style={{ margin: `15px 0px`, color: `#898994`, fontSize: `0.8em`, display: 'flex', alignItems: 'center' }}>
                    Asset
                </div>
                <FlexRow>
                    <SVGImage height={"1.2em"} width={"1.2em"} src={assetImage} />
                    <span style={{ marginLeft: "0.5em", color: "white", fontSize: `1em` }}>{selectedToken?.assetName}</span>
                </FlexRow>
            </FlexRow>
            <FlexRow
                style={{
                    justifyContent: `space-between`,
                    borderBottom: `1px solid #2e2e2e`,
                    marginTop: '10px',
                    marginBottom: '10px'
                }}
            >
                <div style={{ margin: `15px 0px`, color: `#898994`, fontSize: `0.8em`, display: 'flex', alignItems: 'center' }}>
                    Destination Address
                </div>
                <span style={{ marginLeft: "0.5em", color: "white", fontSize: `1em` }}>{UTIL.truncate(destAddr || "", [10, 10])}</span>
            </FlexRow>
            <FlexRow
                style={{
                    justifyContent: `space-between`,
                    borderBottom: `1px solid #2e2e2e`,
                    marginTop: '10px',
                    marginBottom: '10px'
                }}
            >
                <div style={{ margin: `15px 0px`, color: `#898994`, fontSize: `0.8em`, display: 'flex', alignItems: 'center' }}>
                    Send Amount
                </div>
                <span style={{ marginLeft: "0.5em", color: "white", fontSize: `1em` }}>{`${depositAmount} ${selectedToken?.assetSymbol}`}</span>
            </FlexRow>
            <br />
            <br />
            <br />
            {
                errorMsg &&
                <ValidationErrorWidget text={errorMsg} />
            }
            <StyledButtonContainer className={"joyride-input-button"}>
                <StyledButton
                    dim={false}
                    onClick={sendToken}
                >
                    {buttonText}
                </StyledButton>
            </StyledButtonContainer>
        </StyledTransactionStatusWindow>
    )
}

export default SendIBCTransactionWindow
