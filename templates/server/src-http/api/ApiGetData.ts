import { ApiCall } from "tsrpc";
import { ReqGetData, ResGetData } from "../shared/protocols/PtlGetData";
import { AllData } from "./AllData";

export async function ApiGetData(call: ApiCall<ReqGetData, ResGetData>) {
    call.succ({
        data: AllData
    })
}