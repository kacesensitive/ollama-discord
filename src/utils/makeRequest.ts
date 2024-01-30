import ollama from 'ollama';
import { config } from 'dotenv';

config();

export async function makeOllamaRequest(prompt: string, sendChunks: (chunk: string) => Promise<void>, type: () => Promise<void>): Promise<void> {
    const ollamaURL: string = process.env.OLLAMAURL || '127.0.0.1:11434';
    const model: string = process.env.CUSTOMMODEL || 'llama2';
    const discordCharLimit = 1500;
    const typingInterval = 3000;

    if (!ollamaURL || !model) {
        throw new Error("Missing OLLAMAURL or CUSTOMMODEL in environment variables.");
    }

    console.log(`Making request to ${ollamaURL} with model ${model} with prompt ${prompt}`);

    return new Promise<void>(async (resolve, reject) => {
        try {

            const response = await ollama.chat({ model: model, messages: [{ content: prompt, role: 'user' }], stream: false });

            const typingTimer = setInterval(() => {
                type();
            }, typingInterval);

            let fullResponse = '';
            fullResponse = response.message.content;

            while (fullResponse.length > 0) {
                await type();
                let chunk = fullResponse.slice(0, discordCharLimit);
                if (fullResponse.length > discordCharLimit && ![' ', '\n', '\r', '\t'].includes(fullResponse.charAt(discordCharLimit))) {
                    const lastSpace = chunk.lastIndexOf(' ');
                    if (lastSpace > 0) {
                        chunk = chunk.slice(0, lastSpace);
                    }
                }

                await sendChunks(chunk);
                fullResponse = fullResponse.slice(chunk.length).trim();

                if (fullResponse.length > 0) {
                    type();
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            clearInterval(typingTimer);
            resolve();
        } catch (err: any) {
            if (err instanceof Error) {
                reject(`Error: ${err.message}`);
            } else {
                reject("An unknown error occurred.");
            }
        }
    });
}
