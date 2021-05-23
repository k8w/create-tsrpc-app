import * as path from "path";
import { HttpServer, WsServer } from "tsrpc";
import { serviceProto } from "./shared/protocols/serviceProto";

// Create the Server
let server = new HttpServer(serviceProto, {
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