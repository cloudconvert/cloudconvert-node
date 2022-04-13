import * as crypto from 'crypto';

export default class WebhooksResource {
    verify(
        payloadString: string,
        signature: string,
        signingSecret: string
    ): boolean {
        const hmac = crypto.createHmac('sha256', signingSecret);
        const signed = hmac
            .update(Buffer.from(payloadString, 'utf-8'))
            .digest('hex');

        return signature === signed;
    }
}
