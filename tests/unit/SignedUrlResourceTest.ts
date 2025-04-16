import CloudConvert from '../../built/lib/CloudConvert.js';
import { assert } from 'chai';

describe('SignedUrlResource', () => {
    let cloudConvert: CloudConvert;

    beforeEach(() => {
        cloudConvert = new CloudConvert('test');
    });

    describe('create()', () => {
        it('should create a signed URL', async () => {
            const base =
                'https://s.cloudconvert.com/b3d85428-584e-4639-bc11-76b7dee9c109';
            const signingSecret = 'NT8dpJkttEyfSk3qlRgUJtvTkx64vhyX';

            const job = {
                tasks: {
                    'import-it': {
                        operation: 'import/url',
                        url: 'https://some.url',
                        filename: 'logo.png'
                    },
                    'export-it': {
                        operation: 'export/url',
                        input: 'import-it',
                        inline: true
                    }
                }
            } as const;

            const url = cloudConvert.signedUrls.sign(
                base,
                signingSecret,
                job,
                'mykey'
            );

            assert.include(url, base);
            assert.include(url, '?job=');
            assert.include(url, '&cache_key=mykey');
            assert.include(
                url,
                '&s=209d54e4454a407de71a07e6e500f45155fecf58a4e53d68329fbf358efcd823'
            );
        });
    });
});
