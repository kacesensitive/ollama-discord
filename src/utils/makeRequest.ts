import axios, { AxiosResponse } from 'axios';
import { config } from 'dotenv';

config();

interface OllamaResponse {
    response?: string;
    done?: boolean;
}

async function sendStringInChunks(str: string, send: (chunk: string) => Promise<void>) {
    const chunkSize = 1969;
    let index = 0;

    while (index < str.length) {
        const chunk = str.slice(index, index + chunkSize);
        await send(chunk);
        index += chunkSize;
    }
}


export async function makeOllamaRequest(prompt: string, sendChunks: (chunk: string) => Promise<void>, type: () => Promise<void>): Promise<void> {

    const ollamaURL: string = process.env.OLLAMAURL || '127.0.0.1:11434';
    const model: string = process.env.CUSTOMMODEL || 'llama2';

    if (!ollamaURL || !model) {
        throw new Error("Missing OLLAMAURL or CUSTOMMODEL in environment variables.");
    }

    const requestData = {
        model,
        prompt,
    };

    let fullResponse: string = '';

    return new Promise<void>(async (resolve, reject) => {
        try {
            const response: AxiosResponse = await axios.post(`http://${ollamaURL}/api/generate`, requestData, {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'stream',
            });

            response.data.on('data', (chunk: Buffer) => {
                const chunkString: string = chunk.toString('utf8');
                const parsed: OllamaResponse = JSON.parse(chunkString);

                if (parsed.hasOwnProperty('response')) {
                    fullResponse += parsed.response;
                }

                if (parsed.hasOwnProperty('done') && parsed.done) {
                    sendStringInChunks(fullResponse, async (chunk: string) => {
                        await type();
                        await sendChunks(chunk);
                    }).then(() => {
                        console.log("All chunks sent.");
                        resolve();
                    }).catch((err) => {
                        console.log(`An error occurred: ${err}`);
                        reject(err);
                    });
                }
            });

            response.data.on('error', (err: any) => {
                reject(err);
            });
        } catch (err: any) {
            if (err instanceof Error) {
                reject(`Error: ${err.message}`);
            } else {
                reject("An unknown error occurred.");
            }
        }
    });
}
