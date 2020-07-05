import CloudConvert, { JobEventData, TaskEventData } from './CloudConvert';

export default class JobsResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    async get(id: string, query = null) {
        const response = await this.cloudConvert.axios.get('jobs/' + id, {
            params: query || {}
        });
        return response.data.data;
    }

    async wait(id: string) {
        const response = await this.cloudConvert.axios.get('jobs/' + id + '/wait');
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

    async delete(id: string) {
        await this.cloudConvert.axios.delete('jobs/' + id);
    }

    async subscribeEvent(id: string, event: string, callback: (event: JobEventData) => void) {
        this.cloudConvert.subscribe('private-job.' + id, 'job.' + event, callback);
    }

    async subscribeTaskEvent(id: string, event: string, callback: (event: TaskEventData) => void) {
        this.cloudConvert.subscribe('private-job.' + id + '.tasks', 'task.' + event, callback);
    }

}
