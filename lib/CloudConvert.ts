import { io, type Socket } from 'socket.io-client';
import { Readable } from 'node:stream';
import { version } from '../package.json';
import JobsResource, { type JobEventData } from './JobsResource';
import SignedUrlResource from './SignedUrlResource';
import TasksResource, {
    type JobTaskEventData,
    type TaskEventData
} from './TasksResource';
import UsersResource from './UsersResource';
import WebhooksResource from './WebhooksResource';

export type UploadFileSource =
    | Blob
    | Uint8Array
    | Iterable<Uint8Array>
    | AsyncIterable<Uint8Array>
    | NodeJS.ReadableStream;

export class UploadFile {
    private readonly attributes: Array<[key: string, value: unknown]> = [];
    private readonly data: AsyncIterable<Uint8Array>;
    constructor(
        data: UploadFileSource,
        private readonly filename?: string
    ) {
        this.data = UploadFile.unifySources(data);
    }
    add(key: string, value: unknown) {
        this.attributes.push([key, value]);
    }
    async *stream() {
        const enc = new TextEncoder();
        const boundary = `----------${Array.from(Array(32))
            .map(() => Math.random().toString(36)[2] || 0)
            .join('')}`;
        // Start multipart/form-data protocol
        yield enc.encode(`--${boundary}\r\n`);
        // Send all attributes
        const separator = enc.encode(`\r\n--${boundary}\r\n`);
        let first = true;
        for (const [key, value] of this.attributes) {
            if (value == null) continue;
            if (!first) yield separator;
            yield enc.encode(
                `content-disposition:form-data;name="${key}"\r\n\r\n${value}`
            );
            first = false;
        }
        // Send file
        if (!first) yield separator;
        yield enc.encode(
            `content-disposition:form-data;name="file";filename=${this.filename}\r\ncontent-type:application/octet-stream\r\n\r\n`
        );
        yield* this.data;
        // End multipart/form-data protocol
        yield enc.encode(`\r\n--${boundary}--\r\n`);
    }

    static async *unifySources(
        data: UploadFileSource
    ): AsyncIterable<Uint8Array> {
        if (data instanceof Uint8Array) {
            yield data;
            return;
        }

        if (data instanceof Blob) {
            yield data.bytes();
            return;
        }

        if (Symbol.iterator in data) {
            yield* data;
            return;
        }

        if (Symbol.asyncIterator in data) {
            for await (const chunk of data) {
                if (typeof chunk === 'string')
                    throw new Error(
                        'bad file data, received string but expected Uint8Array'
                    );
                yield chunk;
            }
            return;
        }
    }
}

export default class CloudConvert {
    private socket: Socket | undefined;
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
        parameters?: UploadFile | object
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
        parameters?: UploadFile | object
    ) {
        const url = new URL(route, baseURL);
        const { contentType, search, body } = prepareParameters(
            method,
            parameters
        );
        if (search !== undefined) {
            url.search = search;
        }
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            'User-Agent': `cloudconvert-node/v${version} (https://github.com/cloudconvert/cloudconvert-node)`,
            ...(contentType ? { 'Content-Type': contentType } : {})
        };
        const res = await fetch(url, {
            method,
            headers,
            body,
            // @ts-expect-error incorrect types in @types/node@20
            duplex: 'half'
        });
        if (!res.ok) {
            // @ts-expect-error cause not present in types yet
            throw new Error(res.statusText, { cause: res });
        }

        if (
            res.headers.get('Content-Type')?.toLowerCase() !==
            'application/json'
        ) {
            return undefined;
        }
        const { data } = await res.json();
        return data;
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
            this.socket = io(
                this.useSandbox
                    ? 'https://socketio.sandbox.cloudconvert.com'
                    : 'https://socketio.cloudconvert.com',
                { transports: ['websocket'] }
            );
            this.subscribedChannels = new Map<string, boolean>();
        }

        if (!this.subscribedChannels?.get(channel)) {
            this.socket.emit('subscribe', {
                channel,
                auth: { headers: { Authorization: `Bearer ${this.apiKey}` } }
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

function prepareParameters(
    method: 'GET' | 'POST' | 'DELETE',
    data?: UploadFile | object
): {
    contentType?: string;
    body?: string | ReadableStream<Uint8Array>;
    search?: string;
} {
    if (data === undefined) {
        return {};
    }

    if (method === 'GET') {
        // abort early if all data needs to go into the search params
        const entries = Object.entries(data ?? {});
        return { search: new URLSearchParams(entries).toString() };
    }

    if (data instanceof UploadFile) {
        return {
            contentType: 'multipart/form-data',
            body: asyncIterableToReadableStream(data.stream())
        };
    }

    return { contentType: 'application/json', body: JSON.stringify(data) };
}

function asyncIterableToReadableStream(
    it: AsyncIterable<Uint8Array>
): ReadableStream<Uint8Array> {
    const r = Readable.from(it);
    return Readable.toWeb(r) as ReadableStream<Uint8Array>;
}
