import * as crypto from 'crypto';
import { type JobTemplate } from './JobsResource';

export default class SignedUrlResource {
    sign(
        base: string,
        signingSecret: string,
        job: JobTemplate,
        cacheKey: string | null
    ): string {
        const json = JSON.stringify(job);
        const base64 = Buffer.from(json || '').toString('base64');
        const base64UrlSafe = base64
            .replace('+', '-')
            .replace('/', '_')
            .replace(/=+$/, '');

        let url = `${base}?job=${base64UrlSafe}`;

        if (cacheKey) {
            url += `&cache_key=${cacheKey}`;
        }

        const hmac = crypto.createHmac('sha256', signingSecret);
        const signature = hmac.update(Buffer.from(url, 'utf-8')).digest('hex');

        url += `&s=${signature}`;

        return url;
    }
}
