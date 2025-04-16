import CloudConvert from '../../built/lib/CloudConvert.js';
import { assert } from 'chai';
import * as fs from 'fs';
import nock from 'nock';

describe('TasksResource', () => {
    let cloudConvert: CloudConvert;

    beforeEach(() => {
        cloudConvert = new CloudConvert('test');
    });

    describe('all()', () => {
        it('should fetch all tasks', async () => {
            nock('https://api.cloudconvert.com', {
                reqheaders: { Authorization: 'Bearer test' }
            })
                .get('/v2/tasks')
                .replyWithFile(200, __dirname + '/responses/tasks.json', {
                    'Content-Type': 'application/json'
                });

            const data = await cloudConvert.tasks.all();

            assert.isArray(data);
            assert.equal(data[0].id, '73df1e16-fd8b-47a1-a156-f197babde91a');
            assert.isObject(data[0].links);
        });
    });

    describe('get()', () => {
        it('should fetch a task by id', async () => {
            nock('https://api.cloudconvert.com')
                .get('/v2/tasks/4c80f1ae-5b3a-43d5-bb58-1a5c4eb4e46b')
                .replyWithFile(200, __dirname + '/responses/task.json', {
                    'Content-Type': 'application/json'
                });

            const data = await cloudConvert.tasks.get(
                '4c80f1ae-5b3a-43d5-bb58-1a5c4eb4e46b'
            );

            assert.isObject(data);
            assert.equal(data.id, '4c80f1ae-5b3a-43d5-bb58-1a5c4eb4e46b');
        });
    });

    describe('create()', () => {
        it('should send the create request', async () => {
            nock('https://api.cloudconvert.com')
                .post('/v2/convert', {
                    name: 'test',
                    url: 'http://invalid.url',
                    filename: 'test.file'
                })
                .replyWithFile(
                    200,
                    __dirname + '/responses/task_created.json',
                    { 'Content-Type': 'application/json' }
                );

            const data = await cloudConvert.tasks.create('convert', {
                name: 'test',
                url: 'http://invalid.url',
                filename: 'test.file'
            });

            assert.isObject(data);
            assert.equal(data.id, '2f901289-c9fe-4c89-9c4b-98be526bdfbf');
        });
    });

    describe('delete()', () => {
        it('should send the delete request', async () => {
            nock('https://api.cloudconvert.com')
                .delete('/v2/tasks/2f901289-c9fe-4c89-9c4b-98be526bdfbf')
                .reply(204);

            await cloudConvert.tasks.delete(
                '2f901289-c9fe-4c89-9c4b-98be526bdfbf'
            );
        });
    });

    describe('upload()', () => {
        it('should send the upload request', async () => {
            nock('https://api.cloudconvert.com')
                .post('/v2/import/upload')
                .replyWithFile(
                    200,
                    __dirname + '/responses/upload_task_created.json',
                    { 'Content-Type': 'application/json' }
                );

            const task = await cloudConvert.tasks.create('import/upload');

            nock('https://upload.sandbox.cloudconvert.com', {
                reqheaders: { 'Content-Type': /multipart\/form-data/i }
            })
                .post(
                    '/storage.de1.cloud.ovh.net/v1/AUTH_b2cffe8f45324c2bba39e8db1aedb58f/cloudconvert-files-sandbox/8aefdb39-34c8-4c7a-9f2e-1751686d615e/?s=jNf7hn3zox1iZfZY6NirNA&e=1559588529'
                )
                .reply(201);

            const blob = await fs.openAsBlob(
                __dirname + '/../integration/files/input.png'
            );

            await cloudConvert.tasks.upload(task, blob);
        });
    });
});
