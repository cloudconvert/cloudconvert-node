import * as crypto from 'crypto';
import CloudConvert from './CloudConvert';

export default class WebhooksResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    verify(payloadString: string, signature: string, signingSecret: string): boolean {

        let hmac = crypto.createHmac("sha256", signingSecret);
        let signed = hmac.update(new Buffer(payloadString, 'utf-8')).digest("hex");

        return signature === signed;

    }


}
