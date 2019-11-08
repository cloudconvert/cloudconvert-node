import FormData from 'form-data';
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default class JobsResource {

    constructor(cloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    async get(id, query = null) {
        const response = await this.cloudConvert.axios.get('jobs/' + id, {
            params: query || {}
        });
        return response.data.data;
    }

    async all(query = null) {
        const response = await this.cloudConvert.axios.get('jobs', {
            params: query || {}
        });
        return response.data.data;
    }

    async create(data = null) {
        const response = await this.cloudConvert.axios.post('jobs', data);
        return response.data.data;
    }

    async delete(id) {
        await this.cloudConvert.axios.delete('jobs/' + id);
    }

    async subscribeEvent(id, event, callback) {
        this.cloudConvert.subscribe('private-job.' + id, 'job.' + event, callback);
    }

    async subscribeTaskEvent(id, event, callback) {
        this.cloudConvert.subscribe('private-job.' + id + '.tasks', 'task.' + event, callback);
    }
    
    async waitForJobToFinish(jobId, pollingIntervalMS = 2000){
        let jobData = await this.get(jobId)
        while (!(jobData.status === 'finished' || jobData.status === 'error')) {
            jobData = await cloudconvert.jobs.get(jobData.id);
            await sleep(pollingIntervalMS);
        }

        return jobData
    }

}
