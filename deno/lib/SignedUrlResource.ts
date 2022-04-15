import { encode } from 'https://deno.land/std@0.134.0/encoding/base64.ts';
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts';
import CloudConvert from './CloudConvert.ts';
import { JobTemplate } from './JobsResource.ts';

export default class SignedUrlResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    sign(
        base: string,
        signingSecret: string,
        job: JobTemplate,
        cacheKey: string | null,
    ): string {
        const json = JSON.stringify(job);
        const base64 = encode(json);
        const base64UrlSafe = base64
            .replace('+', '-')
            .replace('/', '_')
            .replace(/=+$/, '');

        let url = base + '?job=' + base64UrlSafe;

        if (cacheKey) {
            url += '&cache_key=' + cacheKey;
        }

        const signature = hmac('sha256', signingSecret, url, 'utf8', 'hex');
        url += '&s=' + signature;

        return url;
    }
}
