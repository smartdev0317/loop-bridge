/*
This component makes the API call to the SDK
* */
import { useCallback } from "react"
import { useRecoilState, useSetRecoilState } from "recoil"
import {
    IsTxSubmitting,
} from "state/TransactionStatus"
import { ShowSendIBCTransactionWindow } from "../state/ApplicationStatus"

export default function usePostTransactionToIBCBridge() {
    const [, setShowSendIBCTransactionWindow] =
        useRecoilState(ShowSendIBCTransactionWindow)
    const setIsSubmitting = useSetRecoilState(IsTxSubmitting)

    const handleIBCTransactionSubmission = useCallback(() => {
        return new Promise(async (resolve, reject) => {
            setIsSubmitting(false)

            try {
                setShowSendIBCTransactionWindow(true)
                resolve(true)
            } catch (e: any) {
                /*note: all notifications for postRequest failures are caught directly in that method*/
                setShowSendIBCTransactionWindow(false)
                reject(e)
            }
        })
    }, [
        setShowSendIBCTransactionWindow,
        setIsSubmitting
    ])

    return [
        handleIBCTransactionSubmission as () => Promise<string>,
    ] as const
}
