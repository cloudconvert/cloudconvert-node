import CloudConvert from '../../built/lib/CloudConvert.js';
import { assert } from 'chai';
import * as fs from 'fs';
import { Readable } from 'node:stream';
import { type ReadableStream } from 'node:stream/web';
import * as os from 'os';
import apiKey from './ApiKey.js';

describe('JobsResource', () => {
    let cloudConvert: CloudConvert;
    let tmpPath: string;

    beforeEach(() => {
        cloudConvert = new CloudConvert(apiKey, true);
    });

    describe('create()', () => {
        beforeEach(() => {
            tmpPath = os.tmpdir() + '/tmp.png';
        });

        it('test upload and download files', async () => {
            let job = await cloudConvert.jobs.create({
                tag: 'integration-test-upload-download',
                tasks: {
                    'import-it': { operation: 'import/upload' },
                    'export-it': { input: 'import-it', operation: 'export/url' }
                }
            });

            const uploadTask = job.tasks.filter(
                task => task.name === 'import-it'
            )[0];

            const stream = fs.createReadStream(
                __dirname + '/../integration/files/input.png'
            );

            await cloudConvert.tasks.upload(uploadTask, stream);

            job = await cloudConvert.jobs.wait(job.id);

            assert.equal(job.status, 'finished');

            // download export file
            const file = cloudConvert.jobs.getExportUrls(job)[0];

            assert.equal(file.filename, 'input.png');

            const writer = fs.createWriteStream(tmpPath);

            const response = (await fetch(file.url!)).body as ReadableStream;

            Readable.fromWeb(response).pipe(writer);

            await new Promise<void>((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // check file size
            const stat = fs.statSync(tmpPath);

            assert.equal(stat.size, 46937);

            await cloudConvert.jobs.delete(job.id);
        }).timeout(30000);

        afterEach(() => {
            fs.unlinkSync(tmpPath);
        });
    });

    describe('subscribeEvent()', () => {
        it('test listening for finished event', async () => {
            const job = await cloudConvert.jobs.create({
                tag: 'integration-test-socket',
                tasks: {
                    'import-it': { operation: 'import/upload' },
                    'export-it': { input: 'import-it', operation: 'export/url' }
                }
            });

            const uploadTask = job.tasks.filter(
                task => task.name === 'import-it'
            )[0];

            const stream = fs.createReadStream(
                __dirname + '/../integration/files/input.png'
            );

            setTimeout(() => {
                // for testing, we need to slow down the upload. otherwise we might miss the event because the job finishes too fast
                cloudConvert.tasks.upload(uploadTask, stream);
            }, 1000);

            const event = await new Promise(resolve => {
                cloudConvert.jobs.subscribeEvent(job.id, 'finished', resolve);
            });

            assert.equal(event.job.status, 'finished');

            await cloudConvert.jobs.delete(job.id);
        }).timeout(30000);

        afterEach(() => {
            cloudConvert.closeSocket();
        });
    });
});
