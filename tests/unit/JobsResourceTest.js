import CloudConvert from '../../built/CloudConvert.js';
import {assert} from "chai";
import nock from "nock";


describe('JobsResource', () => {

    beforeEach(() => {
        this.cloudConvert = new CloudConvert('test');
    });


    describe('all()', () => {

        it('should fetch all jobs', async () => {


            nock('https://api.cloudconvert.com', {
                reqheaders: {
                    'Authorization': 'Bearer test'
                }
            })
                .get('/v2/jobs')
                .replyWithFile(200, __dirname + '/responses/jobs.json',
                    {'Content-Type': 'application/json'});

            const data = await this.cloudConvert.jobs.all();

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
                .replyWithFile(200, __dirname + '/responses/job.json',
                    {'Content-Type': 'application/json'});

            const data = await this.cloudConvert.jobs.get('cd82535b-0614-4b23-bbba-b24ab0e892f7');

            assert.isObject(data);
            assert.equal(data.id, 'cd82535b-0614-4b23-bbba-b24ab0e892f7');


        });

    });


    describe('create()', () => {

        it('should send the create request', async () => {


            nock('https://api.cloudconvert.com')
                .post('/v2/jobs', {
                    'tag': 'test',
                    'tasks': {}
                })
                .replyWithFile(200, __dirname + '/responses/job_created.json',
                    {'Content-Type': 'application/json'});

            const data = await this.cloudConvert.jobs.create({
                'tag': 'test',
                'tasks': {}
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

            await this.cloudConvert.jobs.delete('2f901289-c9fe-4c89-9c4b-98be526bdfbf');

        });

    });




});
