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

// Add the textChannel 
let textChannel: TextChannel;

client.once('ready', () => {

  // Get the text channel by ID
  textChannel = client.channels.cache.get(channelIDs[0]) as TextChannel;

  // Send startup messages
  textChannel.send('Ollama Online! Ready to receive messages preceded by ' + trigger);
  
  console.log(`Ollama Online! Ready to receive messages preceded by ${trigger}`); 
});

// Rest of code
client.on('messageCreate', async (message: Message) => {
    console.log("Received message: ", message.content);
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
        console.error('Unable to remove 🤔 reaction:', err);
    }
});

try {
  client.login(process.env.DISCORD_BOT_TOKEN); 
} catch (error) {
  console.error('Unable to login:', error);
}