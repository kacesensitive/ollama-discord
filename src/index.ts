import { Client, GatewayIntentBits, Message } from 'discord.js';
import { config } from 'dotenv';
import { makeOllamaRequest } from './utils/makeRequest';

config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
    ],
});

const channelIDs = process.env.CHANNELIDS?.split(',') || [];

client.once('ready', () => {
    console.log('Ollama Online!');
});

let storedMessage: Message | null = null;

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!channelIDs.includes(message.channel.id)) return;

    if (message.content.startsWith('!llama')) {
        message.channel.sendTyping();
        const query = message.content.replace('!llama ', '');
        try {
            const result = await makeOllamaRequest(query);
            storedMessage = await message.reply(result);
        } catch (err) {
            console.error(err);
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
