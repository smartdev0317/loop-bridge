import { atom } from "recoil"

export const IBCTokenSelectedState = atom<boolean>({
    key: "IBCTokenSelectedState",
    default: false,
})