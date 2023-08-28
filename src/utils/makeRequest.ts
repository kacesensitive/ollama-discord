import axios from 'axios';
import { config } from 'dotenv';

config();

export async function makeOllamaRequest(prompt: string): Promise<string> {
    const ollamaURL = process.env.OLLAMAURL || '127.0.0.1:11434';
    const model = process.env.CUSTOMMODEL || 'llama2';
    const requestData = {
        model: model,
        prompt: prompt,
    };

    let fullResponse = '';

    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.post(`http://${ollamaURL}/api/generate`, requestData, {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'stream',
            });

            response.data.on('data', (chunk: Buffer) => {
                const chunkString = chunk.toString('utf8');
                const parsed = JSON.parse(chunkString);

                if (parsed.hasOwnProperty('response')) {
                    fullResponse += parsed.response;
                }

                if (parsed.hasOwnProperty('done') && parsed.done) {
                    resolve(fullResponse);
                }
            });

            response.data.on('error', (err: any) => {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
}
