export function cmdHelp() {
    outputHelp();
    process.exit();
}

export function outputHelp() {
    console.log('create-tsrpc-app <app-name> [options]'.bgGreen.white);
}