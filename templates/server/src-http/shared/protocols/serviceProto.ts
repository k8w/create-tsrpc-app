import { ServiceProto } from 'tsrpc-proto';
import { ReqHello, ResHello } from './PtlHello'

// This is a template ServiceProto, which is automatically generated.
// Delete it before generate your own's.

export interface ServiceType {
    api: {
        "Hello": {
            req: ReqHello,
            res: ResHello
        }
    },
    msg: {

    }
}

export const serviceProto: ServiceProto<ServiceType> = {
    "services": [
        {
            "id": 0,
            "name": "Hello",
            "type": "api"
        }
    ],
    "types": {
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