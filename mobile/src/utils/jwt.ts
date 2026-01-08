import { Buffer } from 'buffer';

export const parseJwt = (token: string) => {
    try {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch (e) {
        console.error('Failed to parse JWT', e);
        return null;
    }
};
