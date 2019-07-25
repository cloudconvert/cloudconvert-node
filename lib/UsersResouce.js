export default class UsersResouce {

    constructor(cloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    async me() {
        const response = await this.cloudConvert.axios.get('users/me');
        return response.data.data;
    }

    async subscribeJobEvent(id, event, callback) {
        this.cloudConvert.subscribe('private-user.' + id + '.jobs', 'job.' + event, callback);
    }

    async subscribeTaskEvent(id, event, callback) {
        this.cloudConvert.subscribe('private-user.' + id + '.tasks', 'task.' + event, callback);
    }

}
