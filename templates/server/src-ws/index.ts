import * as path from "path";
import { WsServer } from "tsrpc";

// Create the Server
let server = new WsServer(serviceProto, {
    port: 3000,
    cors: '*'
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

main().catch(e => {
    // Exit if any error during the startup
    server.logger.error(e);
    process.exit(-1);
});