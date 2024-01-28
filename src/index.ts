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
let textChannel: TextChannel;

client.once('ready', () => {
  textChannel = client.channels.cache.get(channelIDs[0]) as TextChannel;
  console.log(`Ollama Online! Ready to receive messages preceded by ${trigger}`); 
});

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;
    if (!channelIDs.includes(message.channel.id)) return;
    if (!message.content.startsWith(trigger)) return;

    const textChannel = message.channel as TextChannel;

    const query: string = message.content.replace(trigger, '').trim();
    if (query.length === 0) return;

    let botResponseMessage: Message | null = null;

    async function sendChunk(chunk: string) {
      console.log(`Sending chunk: ${chunk}`);
      if (!chunk.trim()) return;

      if (botResponseMessage === null) {
          botResponseMessage = await textChannel.send(chunk);
      } else {
          await botResponseMessage.edit(botResponseMessage.content + chunk);
      }
    }

    try {
        await message.react('🤔');
        await makeOllamaRequest(query, sendChunk, () => textChannel.sendTyping());
        await message.reactions.cache.get('🤔')?.remove();
    } catch (err: any) {
        console.error('Ollama request failed, is Ollama running?)', err);
    }
});

try {
  client.login(process.env.DISCORD_BOT_TOKEN); 
} catch (error) {
  console.error('Unable to login:', error);
}
