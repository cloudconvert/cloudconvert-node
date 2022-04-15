import CloudConvert from '../../lib/CloudConvert.ts';
import apiKey from './ApiKey.test.ts';

describe('UsersResource', () => {
    beforeEach(() => {
        this.cloudConvert = new CloudConvert(apiKey, true);
    });

    describe('me()', () => {
        it('should fetch the current user', async () => {
            const data = await this.cloudConvert.users.me();

            console.log(data);

            assert.isObject(data);
            assert.containsAllKeys(data, [
                'id',
                'username',
                'email',
                'credits',
            ]);
        });
    });
});
