import * as crypto from 'https://deno.land/std@0.155.0/node/crypto.ts';

export default class WebhooksResource {
    verify(
        payloadString: string,
        signature: string,
        signingSecret: string,
    ): boolean {
        const hmac = crypto.createHmac('sha256', signingSecret);
        const signed = hmac
            .update(btoa(payloadString))
            .digest('hex');

        return signature === signed;
    }
}
