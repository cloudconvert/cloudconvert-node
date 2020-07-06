import CloudConvert from "./CloudConvert";
import { JobEvent, JobEventData } from "./JobsResource";
import { TaskEvent, TaskEventData } from "./TasksResource";

export interface User {
    id: string;
    username: string;
    email: string;
    credits: number;
    created_at: string;
}

export default class UsersResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    async me(): Promise<User> {
        const response = await this.cloudConvert.axios.get('users/me');
        return response.data.data;
    }

    async subscribeJobEvent(id: string, event: JobEvent, callback: (event: JobEventData) => void): Promise<void> {
        this.cloudConvert.subscribe('private-user.' + id + '.jobs', 'job.' + event, callback);
    }

    async subscribeTaskEvent(id: string, event: TaskEvent, callback: (event: TaskEventData) => void): Promise<void> {
        this.cloudConvert.subscribe('private-user.' + id + '.tasks', 'task.' + event, callback);
    }

}
