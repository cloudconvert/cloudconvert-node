import * as crypto from 'crypto';
import CloudConvert from './CloudConvert';

export default class WebhooksResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

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
