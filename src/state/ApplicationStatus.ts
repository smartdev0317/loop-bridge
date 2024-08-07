import { atom } from "recoil"
import { recoilPersist } from "recoil-persist"
import { Nullable } from "../interface/Nullable"

const { persistAtom } = recoilPersist()

export const IsLoggedInWithBetaPassword = atom<boolean>({
  key: "IsLoggedInWithBetaPassword",
  default: true,
})

export const ShowDisclaimer = atom<boolean>({
  key: "ShowDisclaimer",
  default: true,
})
export const ShowLargeDisclaimer = atom<boolean>({
  key: "ShowLargeDisclaimer",
  default: false,
})
export const ShowTransactionHistoryPage = atom<boolean>({
  key: "ShowTransactionHistoryPage",
  default: false,
})
export const ShowDisclaimerFromFAQ = atom<boolean>({
  key: "ShowDisclaimerFromFAQ",
  default: false,
})

export const DismissWalkThrough = atom<boolean>({
  key: "DismissWalkThrough",
  default: false,
  effects_UNSTABLE: [persistAtom],
})

export const DismissFirstTimeBadge = atom<boolean>({
  key: "DismissFirstTimeBadge",
  default: false,
  effects_UNSTABLE: [persistAtom],
})

export const ShowHelperCartoonWidget = atom<boolean>({
  key: "ShowHelperCartoonWidget",
  default: false,
})

export const MessageShownInCartoon = atom<Nullable<any>>({
  key: "MessageShownInCartoon",
  default: null,
})

export const ShowTransactionStatusWindow = atom<boolean>({
  key: "ShowTransactionStatusWindow",
  default: false,
})

export const ShowSendTransactionWindow = atom<boolean>({
  key: "ShowSendTransactionWindow",
  default: false,
})

export const ShowIBCTransactionStatusWindow = atom<boolean>({
  key: "ShowIBCTransactionStatusWindow",
  default: false,
})

export const ShowSendIBCTransactionWindow = atom<boolean>({
  key: "ShowSendIBCTransactionWindow",
  default: false,
})
