import CloudConvert, { JobEvent, JobEventData, TaskEvent, TaskEventData } from "./CloudConvert";

export default class UsersResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    async me() {
        const response = await this.cloudConvert.axios.get('users/me');
        return response.data.data;
    }

    async subscribeJobEvent(id: string, event: JobEvent, callback: (event: JobEventData) => void) {
        this.cloudConvert.subscribe('private-user.' + id + '.jobs', 'job.' + event, callback);
    }

    async subscribeTaskEvent(id: string, event: TaskEvent, callback: (event: TaskEventData) => void) {
        this.cloudConvert.subscribe('private-user.' + id + '.tasks', 'task.' + event, callback);
    }

}
