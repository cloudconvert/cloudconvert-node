import CloudConvert from './CloudConvert';
import {
    type FileResult,
    type Operation,
    type Task,
    type TaskEventData,
    type TaskStatus
} from './TasksResource';

export type JobEvent = 'created' | 'updated' | 'finished' | 'failed';
export type JobStatus = 'processing' | 'finished' | 'error';
export type JobTaskStatus = Task['status'] | 'queued';
export interface JobEventData {
    job: Job;
}

export interface Job {
    id: string;
    tag: string | null;
    status: TaskStatus;
    created_at: string;
    started_at: string | null;
    ended_at: string | null;
    tasks: JobTask[];
}
type NotPresentWhenInsideJob = 'job_id' | 'status';
export interface JobTask extends Omit<Task, NotPresentWhenInsideJob> {
    name: string;
    status: JobTaskStatus;
}

export default class JobsResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    async get(id: string, query?: object): Promise<Job> {
        return await this.cloudConvert.call('GET', `jobs/${id}`, query);
    }

    async wait(id: string): Promise<Job> {
        const baseURL = this.cloudConvert.useSandbox
            ? 'https://sync.api.sandbox.cloudconvert.com/v2/'
            : `https://${
                  this.cloudConvert.region ? this.cloudConvert.region + '.' : ''
              }sync.api.cloudconvert.com/v2/`;
        return await this.cloudConvert.callWithBase(
            baseURL,
            'GET',
            `jobs/${id}`
        );
    }

    async all(query?: {
        'filter[status]'?: JobStatus;
        'filter[tag]'?: string;
        include?: string;
        per_page?: number;
        page?: number;
    }): Promise<Job[]> {
        return await this.cloudConvert.call('GET', 'jobs', query);
    }

    // See below for an explanation on how this type signature works
    async create(data?: JobTemplate): Promise<Job> {
        return await this.cloudConvert.call('POST', 'jobs', data);
    }

    async delete(id: string): Promise<void> {
        await this.cloudConvert.call('DELETE', `jobs/${id}`);
    }

    async subscribeEvent(
        id: string,
        event: string,
        callback: (event: JobEventData) => void
    ) {
        this.cloudConvert.subscribe(
            `private-job.${id}`,
            `job.${event}`,
            callback
        );
    }

    subscribeTaskEvent(
        id: string,
        event: string,
        callback: (event: TaskEventData) => void
    ) {
        this.cloudConvert.subscribe(
            `private-job.${id}.tasks`,
            `task.${event}`,
            callback
        );
    }

    getExportUrls(job: Job): FileResult[] {
        return job.tasks
            .filter(
                task =>
                    task.operation === 'export/url' &&
                    task.status === 'finished'
            )
            .flatMap(task => task.result?.files ?? []);
    }
}

// We need to map the types from the large Operation union type
// to the template syntax from the API specs (confer the README)
// that is used to create a job with a number of tasks. While this
// is possible to write in just two lines of code, we divide this
// up in many small steps in order to explain what's happening:

// All possible operation strings ("import/url" etc)
type PossibleOperationStrings = Operation['operation'];
// Every argument in the tasks object should be assignable to this (for some operation string O)
interface NamedOperation<O> {
    operation: O;
}
// Given an operation string O, get the operation for it
type OperationByName<O> = Extract<Operation, NamedOperation<O>>;
// Given an operation string O, get the operation data for it
type OperationData<O> = OperationByName<O>['data'];
// Add all properties to task that can only occur in tasks that are inside jobs
interface TaskExtras<O> extends NamedOperation<O> {
    ignore_error?: boolean;
}
// Every argument in the tasks object is typed by this (for some operation string O)
type TaskTemplate<O> = TaskExtras<O> & OperationData<O>;
// Given a union type U of operation strings, turn each operation string into its TaskTemplate
type Distribute<U> = U extends unknown ? TaskTemplate<U> : never;
// Create a union of all possible tasks
type PossibleOperations = Distribute<PossibleOperationStrings>;
// Allow any number of names, each typed by a possible operation
interface TaskContainer {
    [name: string]: PossibleOperations;
}
// Add the other properties that are required for job creation
export interface JobTemplate {
    tasks: TaskContainer;
    tag?: string;
    webhook_url?: string;
}
