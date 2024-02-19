import io from 'socket.io-client';
import { version } from '../package.json';
import JobsResource, { type JobEventData } from './JobsResource';
import SignedUrlResource from './SignedUrlResource';
import TasksResource, {
    type JobTaskEventData,
    type TaskEventData
} from './TasksResource';
import UsersResource from './UsersResource';
import WebhooksResource from './WebhooksResource';

export default class CloudConvert {
    private socket: SocketIOClient.Socket | undefined;
    private subscribedChannels: Map<string, boolean> | undefined;

    public readonly apiKey: string;
    public readonly useSandbox: boolean;
    public readonly region: string | null;

    public tasks!: TasksResource;
    public jobs!: JobsResource;
    public users!: UsersResource;
    public webhooks!: WebhooksResource;
    public signedUrls!: SignedUrlResource;

    constructor(apiKey: string, useSandbox = false, region = null) {
        this.apiKey = apiKey;
        this.useSandbox = useSandbox;
        this.region = region;

        this.tasks = new TasksResource(this);
        this.jobs = new JobsResource(this);
        this.users = new UsersResource(this);
        this.webhooks = new WebhooksResource();
        this.signedUrls = new SignedUrlResource();
    }

    async call(
        method: 'GET' | 'POST' | 'DELETE',
        route: string,
        parameters?: FormData | object
    ) {
        const baseURL = this.useSandbox
            ? 'https://api.sandbox.cloudconvert.com/v2/'
            : `https://${
                  this.region ? this.region + '.' : ''
              }api.cloudconvert.com/v2/`;
        return await this.callWithBase(baseURL, method, route, parameters);
    }

    async callWithBase(
        baseURL: string,
        method: 'GET' | 'POST' | 'DELETE',
        route: string,
        parameters?: FormData | object
    ) {
        const res = await fetch(new URL(route, baseURL), {
            method,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'User-Agent': `cloudconvert-node/v${version} (https://github.com/cloudconvert/cloudconvert-node)`
            },
            body:
                parameters instanceof FormData
                    ? parameters
                    : JSON.stringify(parameters)
        });
        return await res.json();
    }

    subscribe(
        channel: string,
        event: string,
        callback:
            | ((event: JobEventData) => void)
            | ((event: TaskEventData) => void)
            | ((event: JobTaskEventData) => void)
    ): void {
        if (!this.socket) {
            this.socket = io.connect(
                this.useSandbox
                    ? 'https://socketio.sandbox.cloudconvert.com'
                    : 'https://socketio.cloudconvert.com',
                {
                    transports: ['websocket']
                }
            );
            this.subscribedChannels = new Map<string, boolean>();
        }

        if (!this.subscribedChannels?.get(channel)) {
            this.socket.emit('subscribe', {
                channel,
                auth: {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`
                    }
                }
            });
            this.subscribedChannels?.set(channel, true);
        }

        this.socket.on(
            event,
            function (eventChannel: string, eventData: any): void {
                if (channel !== eventChannel) {
                    return;
                }
                callback(eventData);
            }
        );
    }

    closeSocket(): void {
        this.socket?.close();
    }
}
