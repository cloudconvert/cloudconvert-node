import CloudConvert from "./CloudConvert";

export default class UsersResouce {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    async me() {
        const response = await this.cloudConvert.axios.get('users/me');
        return response.data.data;
    }

    async subscribeJobEvent(id: string, event: string, callback: Function) {
        this.cloudConvert.subscribe('private-user.' + id + '.jobs', 'job.' + event, callback);
    }

    async subscribeTaskEvent(id: string, event: string, callback: Function) {
        this.cloudConvert.subscribe('private-user.' + id + '.tasks', 'task.' + event, callback);
    }

}
