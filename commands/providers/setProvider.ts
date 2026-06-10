
import { Command } from 'commander';

export const setProviderCommand = new Command("setProvider")
    .description('Lets user set the default provider')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .action((options) => {
        console.log("provider is  " + JSON.stringify(options))
    })
