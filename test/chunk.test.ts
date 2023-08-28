import { sendStringInChunks } from '../src/utils/makeRequest';

describe('sendStringInChunks function', () => {
    it('should send string in chunks', async () => {
        const sendMock = jest.fn();
        const testString = 'a'.repeat(4000);
        const chunkSize = 1969;

        await sendStringInChunks(testString, sendMock);

        expect(sendMock).toHaveBeenCalledTimes(3);

        let index = 0;
        while (index < testString.length) {
            const chunk = testString.slice(index, index + chunkSize);
            expect(sendMock).toHaveBeenCalledWith(chunk);
            index += chunkSize;
        }
    });
});
