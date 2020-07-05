import FormData, { Stream } from 'form-data';
import CloudConvert, { TaskEvent, TaskEventData } from './CloudConvert';

export default class TasksResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    async get(id: string, query = null) {
        const response = await this.cloudConvert.axios.get('tasks/' + id, {
            params: query || {}
        });
        return response.data.data;
    }

    async wait(id: string) {
        const response = await this.cloudConvert.axios.get('tasks/' + id + '/wait');
        return response.data.data;
    }

    async all(query = null) {
        const response = await this.cloudConvert.axios.get('tasks', {
            params: query || {}
        });
        return response.data.data;
    }

    async create(operation: string, data = null) {
        const response = await this.cloudConvert.axios.post(operation, data);
        return response.data.data;
    }

    async delete(id: string) {
        await this.cloudConvert.axios.delete('tasks/' + id);
    }

    async upload(task: any, stream: Stream) {

        if (task.operation !== 'import/upload') {
            throw new Error('The task operation is not import/upload');
        }

        if (task.status !== 'waiting' || !task.result || !task.result.form) {
            throw new Error('The task is not ready for uploading');
        }

        const formData = new FormData();

        for (const parameter in task.result.form.parameters) {
            formData.append(parameter, task.result.form.parameters[parameter]);
        }

        formData.append("file", stream);

        return await this.cloudConvert.axios.post(task.result.form.url, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: null
            }
        });

    }

    async subscribeEvent(id: string, event: TaskEvent, callback: (event: TaskEventData) => void) {
        this.cloudConvert.subscribe('private-task.' + id, 'task.' + event, callback);
    }


}
