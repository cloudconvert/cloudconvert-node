import CloudConvert from './CloudConvert.ts';
import { JobEvent, JobEventData } from './JobsResource.ts';
import { TaskEvent, TaskEventData } from './TasksResource.ts';

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
        const response = await this.cloudConvert.callApi('users/me');
        return response.data;
    }

    subscribeJobEvent(
        id: string,
        event: JobEvent,
        callback: (event: JobEventData) => void,
    ): void {
        this.cloudConvert.subscribe(
            'private-user.' + id + '.jobs',
            'job.' + event,
            callback,
        );
    }

    subscribeTaskEvent(
        id: string,
        event: TaskEvent,
        callback: (event: TaskEventData) => void,
    ): void {
        this.cloudConvert.subscribe(
            'private-user.' + id + '.tasks',
            'task.' + event,
            callback,
        );
    }
}
