import CloudConvert from '../../built/lib/CloudConvert.js';
import { assert } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import apiKey from './ApiKey';
import axios from 'axios';

describe('JobsResource', () => {
    beforeEach(() => {
        this.cloudConvert = new CloudConvert(apiKey, true);
    });

    describe('create()', () => {
        beforeEach(() => {
            this.tmpPath = os.tmpdir() + '/tmp.png';
        });

        it('test upload and download files', async () => {
            let job = await this.cloudConvert.jobs.create({
                tag: 'integration-test-upload-download',
                tasks: {
                    'import-it': {
                        operation: 'import/upload'
                    },
                    'export-it': {
                        input: 'import-it',
                        operation: 'export/url'
                    }
                }
            });

            const uploadTask = job.tasks.filter(
                task => task.name === 'import-it'
            )[0];

            const stream = fs.createReadStream(
                __dirname + '/../integration/files/input.png'
            );

            await this.cloudConvert.tasks.upload(uploadTask, stream);

            job = await this.cloudConvert.jobs.wait(job.id);

            assert.equal(job.status, 'finished');

            // download export file

            const exportTask = job.tasks.filter(
                task => task.name === 'export-it'
            )[0];
            const file = exportTask.result.files[0];

            assert.equal(file.filename, 'input.png');

            const writer = fs.createWriteStream(this.tmpPath);

            const response = await axios(file.url, {
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // check file size
            const stat = fs.statSync(this.tmpPath);

            assert.equal(stat.size, 46937);

            await this.cloudConvert.jobs.delete(job.id);
        }).timeout(30000);

        afterEach(() => {
            fs.unlinkSync(this.tmpPath);
        });
    });

    describe('subscribeEvent()', () => {
        it('test listening for finished event', async () => {
            let job = await this.cloudConvert.jobs.create({
                tag: 'integration-test-socket',
                tasks: {
                    'import-it': {
                        operation: 'import/upload'
                    },
                    'export-it': {
                        input: 'import-it',
                        operation: 'export/url'
                    }
                }
            });

            const uploadTask = job.tasks.filter(
                task => task.name === 'import-it'
            )[0];

            const stream = fs.createReadStream(
                __dirname + '/../integration/files/input.png'
            );

            await this.cloudConvert.tasks.upload(uploadTask, stream);

            const event = await new Promise(resolve => {
                this.cloudConvert.jobs.subscribeEvent(
                    job.id,
                    'finished',
                    resolve
                );
            });

            assert.equal(event.job.status, 'finished');

            await this.cloudConvert.jobs.delete(job.id);
        }).timeout(30000);

        afterEach(() => {
            if (this.cloudConvert.socket) {
                this.cloudConvert.socket.close();
            }
        });
    });
});
