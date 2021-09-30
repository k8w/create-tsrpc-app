let content = `import { TsrpcConfig } from 'tsrpc-cli';

const tsrpcConf: TsrpcConfig = {
    // Generate ServiceProto
    proto: [
        {
            ptlDir: 'src/shared/protocols', // Protocol dir
            output: 'src/shared/protocols/serviceProto.ts', // Path for generated ServiceProto
            apiDir: 'src/api'   // API dir
        }
    ],
    // Sync shared code
    sync: [
        {
            from: 'src/shared',
            to: '../frontend/src/shared',
            type: 'symlink'     // Change this to 'copy' if your environment not support symlink
        }
    ],
    // Dev server
    dev: {
        autoProto: true,        // Auto regenerate proto
        autoSync: true,         // Auto sync when file changed
        autoApi: true,          // Auto create API when ServiceProto updated
        watch: 'src',           // Restart dev server when these files changed
        entry: 'src/index.ts',  // Dev server command: node -r ts-node/register {entry}
    },
    // Build config
    build: {
        autoProto: true,        // Auto generate proto before build
        autoSync: true,         // Auto sync before build
        autoApi: true,          // Auto generate API before build
        outDir: 'dist',         // Clean this dir before build
    }
}
export default tsrpcConf;`;

let final = content.replace(/(sync:\s+\[\n)([\s\S]+)(\],)/, (_, p1, p2, p3) => {
    return p1 + p2.split('\n').map(v => v.replace(/^\s{8}/, '        // ')).join('\n') + p3;
});
console.log(final)