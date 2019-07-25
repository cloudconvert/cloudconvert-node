import axios from "axios";
import io from 'socket.io-client';
import TasksResource from "./TasksResouce";
import UsersResouce from "./UsersResouce";
import JobsResouce from "./JobsResouce";
import WebhooksResouce from "./WebhooksResouce";

export default class CloudConvert {


    constructor(apiKey, useSandbox = false) {

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


    subscribe(channel, event, callback) {

        if (!this.socket) {
            this.socket = io.connect(this.useSandbox ? 'https://socketio.sandbox.cloudconvert.com' : 'https://socketio.cloudconvert.com');
            this.subscribedChannels = {};
        }

        if (!this.subscribedChannels[channel]) {
            this.socket.emit('subscribe', {
                channel,
                auth: {
                    headers: {
                        'Authorization': 'Bearer ' + this.apiKey
                    }
                },
            });
            this.subscribedChannels[channel] = true;
        }

        this.socket.on(event, function (eventChannel, eventData) {
            if (channel !== eventChannel) {
                return;
            }
            callback(eventData);
        });

    }


}


