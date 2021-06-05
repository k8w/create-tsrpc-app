import { i18n } from "../i18n/i18n";

export function cmdHelp() {
    outputHelp();
    process.exit();
}

export function outputHelp() {
    console.log(i18n.help);
}