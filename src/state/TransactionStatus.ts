import { atom, atomFamily } from "recoil"
import { Nullable } from "../interface/Nullable"
import { AssetInfo } from "@axelar-network/axelarjs-sdk"

/*
tracker for the deposit address that is generated by the API
after the user triggers a transfer, i.e. the burner address
where users have to deposit their funds on the source chain as the first
step of the transfer event
*/
export const SourceDepositAddress = atom<Nullable<AssetInfo>>({
  key: "SourceDepositAddress",
  default: null,
})

/*
the "trace ID" is a randomly generated uuid to help track specific
transactions initiated on the UI. for the moment, only used on the UI side.
* */
export const TransactionTraceId = atom<string>({
  key: "TransactionTraceId",
  default: "",
})

export const SrcChainDepositTxHash = atom<string | null>({
  key: "SrcChainDepositTxHash",
  default: null,
})

export const RouteChainDepositTxHash = atom<string | null>({
  key: "RouteChainDepositTxHash",
  default: null,
})

export const SrcChainDepositTxResult = atom<any>({
  key: "SrcChainDepositTxResult",
  default: null,
})

export const RouteChainDepositTxResult = atom<any>({
  key: "RouteChainDepositTxResult",
  default: null,
})

export const HasEnoughDepositConfirmation = atom<boolean>({
  key: "HasEnoughDepositConfirmation",
  default: false,
})

export const DepositMadeInApp = atom<boolean>({
  key: "DepositMadeInApp",
  default: false,
})

/*
TODO: NumberConfirmations is (potentially) deprecated
It had been used to follow the number of confirmations
on probabilistic chains for a transaction before getting
to the threshold we needed
* */
export interface IConfirmationStatus {
  numberConfirmations: Nullable<number>
  numberRequiredConfirmations: Nullable<number>
  transactionHash: Nullable<string>
  amountConfirmedString: Nullable<string>
  height: Nullable<number>
}

export const NumberConfirmations = atomFamily<IConfirmationStatus, string>({
  key: "NumberConfirmations",
  default: {
    numberConfirmations: null,
    numberRequiredConfirmations: null,
    transactionHash: null,
    amountConfirmedString: null,
    height: null
  },
})

export const IsRecaptchaAuthenticated = atom<boolean>({
  key: "IsRecaptchaAuthenticated",
  default: true,
})

export const IsTxSubmitting = atom<boolean>({
  key: "IsTxSubmitting",
  default: false,
})

export const IsBlockchainAuthenticated = atom<boolean>({
  key: "IsBlockchainAuthenticated",
  default: true,
})

export const ActiveStep = atom<number>({
  key: "ActiveStep",
  default: 1,
})

export const DidWaitingForDepositTimeout = atom<boolean>({
  key: "DidWaitingForDepositTimeout",
  default: false,
})

export const DepositTimestamp = atom<number>({
  key: "DepositTimestamp",
  default: 0,
})

export const DepositAmount = atom<string>({
  key: "DepositAmount",
  default: "",
})
