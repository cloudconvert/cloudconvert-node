import { statSync } from 'node:fs';
import { basename } from 'node:path';
import { Readable } from 'node:stream';
import { io, type Socket } from 'socket.io-client';
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

async function* unifySources(
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

function guessNameAndSize(
    source: UploadFileSource,
    fileName?: string,
    fileSize?: number
): { name: string; size: number } {
    const path =
        'path' in source && typeof source.path === 'string'
            ? source.path
            : undefined;
    const name =
        fileName ?? (path !== undefined ? basename(path) : undefined) ?? 'file';
    const size =
        fileSize ??
        (source instanceof Uint8Array ? source.byteLength : undefined) ??
        (source instanceof Blob ? source.size : undefined) ??
        (path !== undefined
            ? statSync(path, { throwIfNoEntry: false })?.size
            : undefined);
    if (size === undefined) {
        throw new Error(
            'Could not determine the number of bytes, specify it explicitly when calling `upload`'
        );
    }
    return { name, size };
}

export class UploadFile {
    private readonly attributes: Array<[key: string, value: unknown]> = [];
    private readonly data: AsyncIterable<Uint8Array>;
    private readonly filename?: string;
    private readonly fileSize: number;
    constructor(data: UploadFileSource, filename?: string, fileSize?: number) {
        this.data = unifySources(data);
        const { name, size } = guessNameAndSize(data, filename, fileSize);
        this.filename = name;
        this.fileSize = size;
    }
    add(key: string, value: unknown) {
        this.attributes.push([key, value]);
    }
    toMultiPart(boundary: string): {
        size: number;
        stream: AsyncIterable<Uint8Array>;
    } {
        const enc = new TextEncoder();
        const prefix: Uint8Array[] = [];
        const suffix: Uint8Array[] = [];

        // Start multipart/form-data protocol
        prefix.push(enc.encode(`--${boundary}\r\n`));
        // Send all attributes
        const separator = enc.encode(`\r\n--${boundary}\r\n`);
        let first = true;
        for (const [key, value] of this.attributes) {
            if (value == null) continue;
            if (!first) prefix.push(separator);
            prefix.push(
                enc.encode(
                    `content-disposition:form-data;name="${key}"\r\n\r\n${value}`
                )
            );
            first = false;
        }
        // Send file
        if (!first) prefix.push(separator);
        prefix.push(
            enc.encode(
                `content-disposition:form-data;name="file";filename=${this.filename}\r\ncontent-type:application/octet-stream\r\n\r\n`
            )
        );
        const data = this.data;
        // End multipart/form-data protocol
        suffix.push(enc.encode(`\r\n--${boundary}--\r\n`));

        const size =
            prefix.reduce((sum, arr) => sum + arr.byteLength, 0) +
            this.fileSize +
            suffix.reduce((sum, arr) => sum + arr.byteLength, 0);
        async function* concat() {
            yield* prefix;
            yield* data;
            yield* suffix;
        }
        return { size, stream: concat() };
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
        parameters?: UploadFile | object,
        options?: { presigned?: boolean; flat?: boolean }
    ) {
        const baseURL = this.useSandbox
            ? 'https://api.sandbox.cloudconvert.com/v2/'
            : `https://${
                  this.region ? this.region + '.' : ''
              }api.cloudconvert.com/v2/`;
        return await this.callWithBase(
            baseURL,
            method,
            route,
            parameters,
            options
        );
    }

    async callWithBase(
        baseURL: string,
        method: 'GET' | 'POST' | 'DELETE',
        route: string,
        parameters?: UploadFile | object,
        options?: { presigned?: boolean; flat?: boolean }
    ) {
        const presigned = options?.presigned ?? false;
        const flat = options?.flat ?? false;
        const url = new URL(route, baseURL);
        const { contentLength, contentType, search, body } = prepareParameters(
            method,
            parameters
        );
        if (search !== undefined) {
            url.search = search;
        }
        const headers = {
            'User-Agent': `cloudconvert-node/v${version} (https://github.com/cloudconvert/cloudconvert-node)`,
            ...(!presigned ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            ...(contentLength ? { 'Content-Length': contentLength } : {}),
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
            !res.headers
                .get('content-type')
                ?.toLowerCase()
                .includes('application/json')
        ) {
            return undefined;
        }
        const json = await res.json();
        return flat ? json : json.data;
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
    contentLength?: string;
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
        const boundary = `----------${Array.from(Array(32))
            .map(() => Math.random().toString(36)[2] || 0)
            .join('')}`;
        const { size, stream } = data.toMultiPart(boundary);
        return {
            contentLength: size.toString(),
            contentType: `multipart/form-data; boundary=${boundary}`,
            body: asyncIterableToReadableStream(stream)
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
