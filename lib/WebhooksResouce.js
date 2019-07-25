import * as crypto from 'crypto';

export default class WebhooksResouce {

    constructor(cloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    verify(payloadString, signature, signingSecret) {

        let hmac = crypto.createHmac("sha256", signingSecret);
        let signed = hmac.update(new Buffer(payloadString, 'utf-8')).digest("hex");

        return signature === signed;

    }


}
