import ollama from 'ollama';
import { config } from 'dotenv';

config();

export async function makeOllamaRequest(prompt: string, sendChunks: (chunk: string) => Promise<void>, type: () => Promise<void>): Promise<void> {

    const ollamaURL: string = process.env.OLLAMAURL || '127.0.0.1:11434';
    const model: string = process.env.CUSTOMMODEL || 'llama2';

    if (!ollamaURL || !model) {
        throw new Error("Missing OLLAMAURL or CUSTOMMODEL in environment variables.");
    }

    console.log(`Making request to ${ollamaURL} with model ${model} with prompt ${prompt}`);

    return new Promise<void>(async (resolve, reject) => {
        try {

            const response = await ollama.chat({ model: 'llama2', messages: [{ content: prompt, role: 'user' }], stream: true })
            for await (const part of response) {
                await type();
                await sendChunks(part.message.content);
            }
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
