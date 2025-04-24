import CloudConvert from '../../built/lib/CloudConvert.js';
import { assert } from 'chai';
import nock from 'nock';

describe('JobsResource', () => {
    let cloudConvert: CloudConvert;

    beforeEach(() => {
        cloudConvert = new CloudConvert('test');
    });

    describe('all()', () => {
        it('should fetch all jobs', async () => {
            nock('https://api.cloudconvert.com', {
                reqheaders: { Authorization: 'Bearer test' }
            })
                .get('/v2/jobs')
                .replyWithFile(200, __dirname + '/responses/jobs.json', {
                    'Content-Type': 'application/json'
                });

            const data = await cloudConvert.jobs.all();

            assert.isArray(data);
            assert.equal(data[0].id, 'bd7d06b4-60fb-472b-b3a3-9034b273df07');
            assert.isObject(data[0].links);
        });
    });

    describe('get()', () => {
        it('should fetch a job by id', async () => {
            nock('https://api.cloudconvert.com')
                .get('/v2/jobs/cd82535b-0614-4b23-bbba-b24ab0e892f7')
                .query(true)
                .replyWithFile(200, __dirname + '/responses/job.json', {
                    'Content-Type': 'application/json'
                });

            const data = await cloudConvert.jobs.get(
                'cd82535b-0614-4b23-bbba-b24ab0e892f7'
            );

            assert.isObject(data);
            assert.equal(data.id, 'cd82535b-0614-4b23-bbba-b24ab0e892f7');
        });
    });

    describe('create()', () => {
        it('should send the create request', async () => {
            nock('https://api.cloudconvert.com')
                .post('/v2/jobs', { tag: 'test', tasks: {} })
                .replyWithFile(200, __dirname + '/responses/job_created.json', {
                    'Content-Type': 'application/json'
                });

            const data = await cloudConvert.jobs.create({
                tag: 'test',
                tasks: {}
            });

            assert.isObject(data);
            assert.equal(data.id, 'c677ccf7-8876-4f48-bb96-0ab8e0d88cd7');
        });
    });

    describe('delete()', () => {
        it('should send the delete request', async () => {
            nock('https://api.cloudconvert.com')
                .delete('/v2/jobs/2f901289-c9fe-4c89-9c4b-98be526bdfbf')
                .reply(204);

            await cloudConvert.jobs.delete(
                '2f901289-c9fe-4c89-9c4b-98be526bdfbf'
            );
        });
    });

    describe('getExportUrls()', () => {
        it('should extract the export URLs', async () => {
            nock('https://api.cloudconvert.com')
                .get('/v2/jobs/b2e4eb2b-a744-4da2-97cd-776d393532a8')
                .query(true)
                .replyWithFile(
                    200,
                    __dirname + '/responses/job_finished.json',
                    { 'Content-Type': 'application/json' }
                );

            const job = await cloudConvert.jobs.get(
                'b2e4eb2b-a744-4da2-97cd-776d393532a8',
                { include: 'tasks' }
            );

            const exportUrls = cloudConvert.jobs.getExportUrls(job);

            assert.isArray(exportUrls);
            assert.lengthOf(exportUrls, 1);

            assert.equal(exportUrls[0].filename, 'original.png');
            assert.match(
                exportUrls[0].url,
                new RegExp('^https://storage.cloudconvert.com/')
            );
        });
    });
});
