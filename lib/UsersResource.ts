import CloudConvert from './CloudConvert';
import { type JobEvent, type JobEventData } from './JobsResource';
import { type TaskEvent, type TaskEventData } from './TasksResource';

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
        return await this.cloudConvert.call('GET', 'users/me');
    }

    async subscribeJobEvent(
        id: string,
        event: JobEvent,
        callback: (event: JobEventData) => void
    ): Promise<void> {
        this.cloudConvert.subscribe(
            `private-user.${id}.jobs`,
            `job.${event}`,
            callback
        );
    }

    async subscribeTaskEvent(
        id: string,
        event: TaskEvent,
        callback: (event: TaskEventData) => void
    ): Promise<void> {
        this.cloudConvert.subscribe(
            `private-user.${id}.tasks`,
            `task.${event}`,
            callback
        );
    }
}
