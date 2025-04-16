import CloudConvert from '../../built/lib/CloudConvert.js';
import { assert } from 'chai';
import nock from 'nock';

describe('UsersResource', () => {
    let cloudConvert: CloudConvert;

    beforeEach(() => {
        cloudConvert = new CloudConvert('test');
    });

    describe('me()', () => {
        it('should fetch the current user', async () => {
            nock('https://api.cloudconvert.com')
                .get('/v2/users/me')
                .replyWithFile(200, __dirname + '/responses/user.json', {
                    'Content-Type': 'application/json'
                });

            const data = await cloudConvert.users.me();

            assert.isObject(data);
            assert.equal(data.id, 1);
            assert.equal(data.credits, 4434);
        });
    });
});
