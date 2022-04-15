import CloudConvert from './CloudConvert.ts';
import { type JobEvent, type JobEventData } from './JobsResource.ts';
import { type TaskEvent, type TaskEventData } from './TasksResource.ts';

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

    async subscribeJobEvent(
        id: string,
        event: JobEvent,
        callback: (event: JobEventData) => void,
    ): Promise<void> {
        this.cloudConvert.subscribe(
            `private-user.${id}.jobs`,
            `job.${event}`,
            callback,
        );
    }

    async subscribeTaskEvent(
        id: string,
        event: TaskEvent,
        callback: (event: TaskEventData) => void,
    ): Promise<void> {
        this.cloudConvert.subscribe(
            `private-user.${id}.tasks`,
            `task.${event}`,
            callback,
        );
    }
}
