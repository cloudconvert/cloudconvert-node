import * as crypto from 'crypto';
import CloudConvert from './CloudConvert';
import { JobTemplate } from './JobsResource';

export default class SignedUrlResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    sign(
        base: string,
        signingSecret: string,
        job: JobTemplate,
        cacheKey: string | null
    ): string {
        const json = JSON.stringify(job);
        const base64 = new Buffer(json || '').toString('base64');
        const base64UrlSafe = base64
            .replace('+', '-')
            .replace('/', '_')
            .replace(/=+$/, '');

        let url = base + '?job=' + base64UrlSafe;

        if (cacheKey) {
            url += '&cache_key=' + cacheKey;
        }

        const hmac = crypto.createHmac('sha256', signingSecret);
        const signature = hmac.update(Buffer.from(url, 'utf-8')).digest('hex');

        url += '&s=' + signature;

        return url;
    }
}
