import * as crypto from 'https://deno.land/std@0.155.0/node/crypto.ts';
import { type JobTemplate } from './JobsResource.ts';

export default class SignedUrlResource {
    sign(
        base: string,
        signingSecret: string,
        job: JobTemplate,
        cacheKey: string | null,
    ): string {
        const json = JSON.stringify(job);
        const base64 = btoa(json || '');
        const base64UrlSafe = base64
            .replace('+', '-')
            .replace('/', '_')
            .replace(/=+$/, '');

        let url = `${base}?job=${base64UrlSafe}`;

        if (cacheKey) {
            url += `&cache_key=${cacheKey}`;
        }

        const hmac = crypto.createHmac('sha256', signingSecret);
        const signature = hmac.update(btoa(url)).digest('hex');

        url += `&s=${signature}`;

        return url;
    }
}
