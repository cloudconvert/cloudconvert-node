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

            console.log('task', task);
            const stream = fs.createReadStream(
                __dirname + '/../integration/files/input.png'
            );

            const res = await cloudConvert.tasks.upload(task, stream);
            console.log('upload', res);

            task = await cloudConvert.tasks.wait(task.id);
            console.log('task', task);

            assert.equal(task.status, 'finished');
            assert.equal(task.result.files[0].filename, 'input.png');

            const del = await cloudConvert.tasks.delete(task.id);
            console.log(del);
        }).timeout(30000);
    });
});
