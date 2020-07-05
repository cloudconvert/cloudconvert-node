import axios, { AxiosInstance } from "axios";
import io from 'socket.io-client';
import JobsResouce from "./JobsResouce";
import TasksResource from "./TasksResouce";
import UsersResouce from "./UsersResouce";
import WebhooksResouce from "./WebhooksResouce";

export type JobEvent = 'created' | 'updated' | 'finished' | 'error' | 'deleted'
export type TaskEvent = 'created' | 'updated' | 'finished' | 'error' | 'deleted'

export interface Job {

}

export interface Task {
    
}

export interface JobEventData { job: Job }
export interface TaskEventData { task: Task }

export default class CloudConvert {
    private socket: SocketIOClient.Socket | undefined;
    private subscribedChannels: Map<string, boolean> | undefined;
    
    public readonly apiKey: string;
    public readonly useSandbox: boolean;
    
    public axios!: AxiosInstance;
    public tasks!: TasksResource;
    public jobs!: JobsResouce;
    public users!: UsersResouce;
    public webhooks!: WebhooksResouce;

    constructor(apiKey: string, useSandbox = false) {

        this.apiKey = apiKey;
        this.useSandbox = useSandbox;

        this.createAxiosInstance();
        this.createResources();

    }


    createAxiosInstance() {
        this.axios = axios.create({
            baseURL: this.useSandbox ? 'https://api.sandbox.cloudconvert.com/v2/' : 'https://api.cloudconvert.com/v2/',
            headers: {
                'Authorization': 'Bearer ' + this.apiKey,
                'User-Agent': 'cloudconvert-node/v2 (https://github.com/cloudconvert/cloudconvert-node)'
            }
        });
    }

    createResources() {
        this.tasks = new TasksResource(this);
        this.jobs = new JobsResouce(this);
        this.users = new UsersResouce(this);
        this.webhooks = new WebhooksResouce(this);
    }


    subscribe(channel: string, event: string, callback: ((event: JobEventData) => void) | ((event: TaskEventData) => void)): void {

        if (!this.socket) {
            this.socket = io.connect(this.useSandbox ? 'https://socketio.sandbox.cloudconvert.com' : 'https://socketio.cloudconvert.com', {
                transports: ['websocket']
            });
            this.subscribedChannels = new Map<string, boolean>();
        }

        if (!this.subscribedChannels?.get(channel)) {
            this.socket.emit('subscribe', {
                channel,
                auth: {
                    headers: {
                        'Authorization': 'Bearer ' + this.apiKey
                    }
                },
            });
            this.subscribedChannels?.set(channel, true);
        }

        this.socket.on(event, function (eventChannel: string, eventData: any): void {
            if (channel !== eventChannel) {
                return;
            }
            callback(eventData);
        });

    }


}


