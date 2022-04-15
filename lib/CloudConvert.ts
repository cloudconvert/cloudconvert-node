import * as io from 'https://esm.sh/socket.io-client@2.4.0';
import JobsResource, { JobEventData } from './JobsResource.ts';
import TasksResource, { TaskEventData } from './TasksResource.ts';
import UsersResource from './UsersResource.ts';
import WebhooksResource from './WebhooksResource.ts';
import { version } from './version.ts';
import SignedUrlResource from './SignedUrlResource.ts';

interface ApiCallParams {
    method: string;
    baseURL: string;
    params: Record<string, unknown> | null;
}

export default class CloudConvert {
    private socket?: any;
    private subscribedChannels: Map<string, boolean> | undefined;

    public tasks: TasksResource;
    public jobs: JobsResource;
    public users: UsersResource;
    public webhooks: WebhooksResource;
    public signedUrls: SignedUrlResource;

    constructor(
        public readonly apiKey: string,
        public readonly useSandbox = false,
    ) {
        this.tasks = new TasksResource(this);
        this.jobs = new JobsResource(this);
        this.users = new UsersResource(this);
        this.webhooks = new WebhooksResource();
        this.signedUrls = new SignedUrlResource(this);
    }

    async callApi(path: string, config?: Partial<ApiCallParams>) {
        const baseUrl = config?.baseURL ??
            (this.useSandbox
                ? 'https://api.sandbox.cloudconvert.com/v2/'
                : 'https://api.cloudconvert.com/v2/');
        const url = baseUrl + path;
        const method = config?.method;
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            'User-Agent':
                `cloudconvert-node/v${version} (https://github.com/cloudconvert/cloudconvert-node)`,
        };
        const body = config?.params == null
            ? undefined
            : JSON.stringify(config?.params);
        const response = await fetch(url, { method, headers, body });
        return await response.json();
    }

    subscribe(
        channel: string,
        event: string,
        callback:
            | ((event: JobEventData) => void)
            | ((event: TaskEventData) => void),
    ): void {
        if (!this.socket) {
            this.socket = io.connect(
                this.useSandbox
                    ? 'https://socketio.sandbox.cloudconvert.com'
                    : 'https://socketio.cloudconvert.com',
                {
                    transports: ['websocket'],
                },
            );
            this.subscribedChannels = new Map<string, boolean>();
        }

        if (!this.subscribedChannels?.get(channel)) {
            this.socket.emit('subscribe', {
                channel,
                auth: {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                },
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
            },
        );
    }

    closeSocket(): void {
        this.socket?.close();
    }
}
