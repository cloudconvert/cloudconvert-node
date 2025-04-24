import CloudConvert from '../../built/lib/CloudConvert.js';
import apiKey from './ApiKey.js';
import { assert } from 'chai';

describe('UsersResource', () => {
    let cloudConvert: CloudConvert;

    beforeEach(() => {
        cloudConvert = new CloudConvert(apiKey, true);
    });

    describe('me()', () => {
        it('should fetch the current user', async () => {
            const data = await cloudConvert.users.me();

            console.log(data);

            assert.isObject(data);
            assert.containsAllKeys(data, [
                'id',
                'username',
                'email',
                'credits'
            ]);
        });
    });
});
