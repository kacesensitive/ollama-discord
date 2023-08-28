import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import { config } from 'dotenv';
import { makeOllamaRequest } from './utils/makeRequest';

config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

const channelIDs: string[] = process.env.CHANNELIDS?.split(',') || [];
const trigger: string = process.env.TRIGGER || '!llama';

client.once('ready', () => {
    console.log('Ollama Online!');
});

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;
    if (!channelIDs.includes(message.channel.id)) return;
    if (!message.content.startsWith(trigger)) return;

    const textChannel = message.channel as TextChannel;

    const query: string = message.content.replace(trigger, '').trim();
    if (query.length === 0) return;

    const sendChunks = async (chunk: string) => {
        await message.reply(chunk);
    };

    try {
        await message.react('🤔');
        await makeOllamaRequest(query, sendChunks, () => textChannel.sendTyping());
        await message.reactions.cache.get('🤔')?.remove();
    } catch (err: any) {
        await message.reactions.cache.get('🤔')?.remove();
        console.error(err);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);