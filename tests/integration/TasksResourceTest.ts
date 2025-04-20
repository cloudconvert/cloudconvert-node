import CloudConvert from '../../built/lib/CloudConvert.js';
import { assert } from 'chai';
import * as fs from 'fs';
import apiKey from './ApiKey.js';

describe('TasksResource', () => {
    let cloudConvert: CloudConvert;

    beforeEach(() => {
        cloudConvert = new CloudConvert(apiKey, true);
    });

    describe('upload()', () => {
        it('uploads input.png', async () => {
            let task = await cloudConvert.tasks.create('import/upload', {
                name: 'upload-test'
            });

            const stream = fs.createReadStream(
                __dirname + '/../integration/files/input.png'
            );

            await cloudConvert.tasks.upload(task, stream);

            task = await cloudConvert.tasks.wait(task.id);

            assert.equal(task.status, 'finished');
            assert.equal(task.result.files[0].filename, 'input.png');

            await cloudConvert.tasks.delete(task.id);
        }).timeout(30000);
    });
});
