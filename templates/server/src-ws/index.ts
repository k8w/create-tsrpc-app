import * as path from "path";
import { WsServer } from "tsrpc";
import { serviceProto } from './shared/protocols/serviceProto';

// Create the Server
let server = new WsServer(serviceProto, {
    port: 3000
});

// Entry function
async function main() {
    // Auto implement APIs
    await server.autoImplementApi(path.resolve(__dirname, 'api'));

    // TODO
    // Prepare something... (e.g. connect the db)

    // Start the server
    server.start();
};

// Send `MsgPublic`
export async function sendPublicMsg(content: string) {
    server.broadcastMsg('Public', {
        content: content,
        time: new Date()
    });
}

main().catch(e => {
    // Exit if any error during the startup
    server.logger.error(e);
    process.exit(-1);
});