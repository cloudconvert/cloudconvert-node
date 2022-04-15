import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts';

export default class WebhooksResource {
    verify(
        payloadString: string,
        signature: string,
        signingSecret: string,
    ): boolean {
        const signed = hmac(
            'sha256',
            signingSecret,
            payloadString,
            'utf8',
            'hex',
        );
        return signature === signed;
    }
}
