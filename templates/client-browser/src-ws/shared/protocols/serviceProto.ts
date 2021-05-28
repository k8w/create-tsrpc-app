import { ServiceProto } from 'tsrpc-proto';
import { MsgPublic } from './MsgPublic'
import { ReqHello, ResHello } from './PtlHello'

export interface ServiceType {
    api: {
        "Hello": {
            req: ReqHello,
            res: ResHello
        }
    },
    msg: {
        "Public": MsgPublic
    }
}

export const serviceProto: ServiceProto<ServiceType> = {
    "services": [
        {
            "id": 0,
            "name": "Public",
            "type": "msg"
        },
        {
            "id": 1,
            "name": "Hello",
            "type": "api"
        }
    ],
    "types": {
        "MsgPublic/MsgPublic": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "content",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "time",
                    "type": {
                        "type": "Date"
                    }
                }
            ]
        },
        "PtlHello/ReqHello": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "name",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlHello/ResHello": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "reply",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        }
    }
};