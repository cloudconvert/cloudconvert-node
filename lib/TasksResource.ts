import FormData, { Stream } from 'form-data';
import CloudConvert from './CloudConvert';

export type TaskEvent = 'created' | 'updated' | 'finished' | 'failed';
export type TaskStatus = 'waiting' | 'processing' | 'finished' | 'error';
export interface TaskEventData { task: Task }

export type Operation = ImportOperation | TaskOperation | ExportOperation;
export type ImportOperation = ImportUpload | ImportUrl | ImportS3 | ImportAzureBlob | ImportGoogleCloudStorage | ImportOpenStack | ImportSFTP;
export type TaskOperation = TaskConvert | TaskCapture | TaskOptimize | TaskThumbnail | TaskMerge | TaskArchive | TaskCommand;
export type ExportOperation = ExportUrl | ExportS3 | ExportAzureBlob | ExportGoogleCloudStorage | ExportOpenStack | ExportSFTP;

interface ImportUpload {
    operation: 'import/upload';
    data: ImportUploadData;
}
export interface ImportUploadData {
    redirect?: string;
}

interface ImportUrl {
    operation: 'import/url';
    data: ImportUrlData;
}
export interface ImportUrlData {
    url: string;
    filename?: string;
    headers?: { [key: string]: string; };
}

interface ImportS3 {
    operation: 'import/s3';
    data: ImportS3Data;
}
export interface ImportS3Data {
    bucket: string;
    region: string;
    endpoint?: string;
    key?: string;
    key_prefix?: string;
    access_key_id: string;
    secret_access_key: string;
    session_token?: string;
    filename?: string;
}

interface ImportAzureBlob {
    operation: 'import/azure/blob';
    data: ImportAzureBlobData;
}
export interface ImportAzureBlobData {
    storage_account: string;
    storage_access_key?: string;
    sas_token?: string;
    container: string;
    blob?: string;
    blob_prefix?: string;
    filename?: string;
}

interface ImportGoogleCloudStorage {
    operation: 'import/google-cloud-storage';
    data: ImportGoogleCloudStorageData;
}
export interface ImportGoogleCloudStorageData {
    project_id: string;
    bucket: string;
    client_email: string;
    private_key: string;
    file?: string;
    file_prefix?: string;
    filename?: string;
}

interface ImportOpenStack {
    operation: 'import/openstack';
    data: ImportOpenStackData;
}
export interface ImportOpenStackData {
    auth_url: string;
    username: string;
    password: string;
    region: string;
    container: string;
    file?: string;
    file_prefix?: string;
    filename?: string;
}

interface ImportSFTP {
    operation: 'import/sftp';
    data: ImportSFTPData;
}
export interface ImportSFTPData {
    host: string;
    port?: number;
    username: string;
    password?: string;
    private_key?: string;
    file?: string;
    path?: string;
    filename?: string;
}

interface TaskConvert {
    operation: 'convert';
    data: TaskConvertData;
}
export interface TaskConvertData {
    input: string | string[];
    input_format?: string;
    output_format: string;
    engine?: string;
    engine_version?: string;
    filename?: string;
    [option: string]: any;
}

interface TaskCapture {
    operation: 'capture-website';
    data: TaskCaptureData;
}
export interface TaskCaptureData {
    url: string;
    output_format: string;
    engine?: string;
    engine_version?: string;
    filename?: string;
    pages?: string;
    zoom?: number;
    page_width?: number;
    page_height?: number;
    margin_top?: number;
    margin_bottom?: number;
    margin_left?: number;
    margin_right?: number;
    print_background?: boolean;
    display_header_footer?: boolean;
    header_template?: string;
    footer_template?: string;
    wait_until?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
    wait_for_element?: string;
    wait_time?: number;
    headers?: { [header: string]: string; };
}

interface TaskOptimize {
    operation: 'optimize';
    data: TaskOptimizeData;
}
export interface TaskOptimizeData {
    input: string | string[];
    input_format?: 'jpg' | 'png' | 'pdf';
    engine?: string;
    engine_version?: string;
    filename?: string;
    quality?: number;
    profile?: 'web' | 'print' | 'archive' | 'mrc' | 'max';
    [option: string]: any;
}

interface TaskThumbnail {
    operation: 'thumbnail';
    data: TaskThumbnailData;
}
export interface TaskThumbnailData {
    input: string | string[];
    input_format?: string;
    output_format: 'png' | 'jpg';
    engine?: string;
    engine_version?: string;
    filename?: string;
    [option: string]: any;
}

interface TaskMerge {
    operation: 'merge';
    data: TaskMergeData;
}
export interface TaskMergeData {
    input: string | string[];
    output_format: 'pdf';
    engine?: string;
    engine_version?: string;
    filename?: string;
}

interface TaskArchive {
    operation: 'archive';
    data: TaskArchiveData;
}
export interface TaskArchiveData {
    input: string | string[];
    output_format: string;
    engine?: string;
    engine_version?: string;
    filename?: string;
}

interface TaskCommand {
    operation: 'command';
    data: TaskCommandData;
}
interface TaskCommandBaseData {
    input: string | string[];
    engine_version?: string;
    capture_output?: boolean;
    arguments: string;
}
interface TaskCommandFfmpegData         extends TaskCommandBaseData { engine: 'ffmpeg'        ; command: 'ffmpeg' | 'ffprobe'  ; }
interface TaskCommandGraphicsmagickData extends TaskCommandBaseData { engine: 'graphicsmagick'; command: 'gm'                  ; }
interface TaskCommandImagemagickData    extends TaskCommandBaseData { engine: 'imagemagick'   ; command: 'convert' | 'identify'; }
export type TaskCommandData = TaskCommandFfmpegData | TaskCommandGraphicsmagickData | TaskCommandImagemagickData;

interface ExportUrl {
    operation: 'export/url';
    data: ExportUrlData;
}
export interface ExportUrlData {
    input: string | string[];
    inline?: boolean;
    archive_multiple_files?: boolean;
}

interface ExportS3 {
    operation: 'export/s3';
    data: ExportS3Data;
}
export interface ExportS3Data {
    input: string | string[];
    bucket: string;
    region: string;
    endpoint?: string;
    key?: string;
    key_prefix?: string;
    access_key_id: string;
    secret_access_key: string;
    session_token?: string;
    acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read' | 'bucket-owner-read' | 'bucket-owner-full-control';
    cache_control?: string;
    metadata?: object;
    server_side_encryption?: string;
}

interface ExportAzureBlob {
    operation: 'export/azure/blob';
    data: ExportAzureBlobData;
}
export interface ExportAzureBlobData {
    input: string | string[];
    storage_account: string;
    storage_access_key?: string;
    sas_token?: string;
    container: string;
    blob?: string;
    blob_prefix?: string;
}

interface ExportGoogleCloudStorage {
    operation: 'export/google-cloud-storage';
    data: ExportGoogleCloudStorageData;
}
export interface ExportGoogleCloudStorageData {
    input: string | string[];
    project_id: string;
    bucket: string;
    client_email: string;
    private_key: string;
    file?: string;
    file_prefix?: string;
}

interface ExportOpenStack {
    operation: 'export/openstack';
    data: ExportOpenStackData;
}
export interface ExportOpenStackData {
    input: string | string[];
    auth_url: string;
    username: string;
    password: string;
    region: string;
    container: string;
    file?: string;
    file_prefix?: string;
}

interface ExportSFTP {
    operation: 'export/sftp';
    data: ExportSFTPData;
}
export interface ExportSFTPData {
    input: string | string[];
    host: string;
    port?: number;
    username: string;
    password?: string;
    private_key?: string;
    file?: string;
    path?: string;
}

export interface Task {
    id: string;
    job_id: string;
    operation: Operation['operation'];
    status: TaskStatus;
    message: string | null;
    code: string | null;
    credits: number | null;
    created_at: string;
    started_at: string | null;
    ended_at: string | null;
    depends_on_tasks: { [task: string]: string; };
    retry_of_task_id?: string | null;
    retries?: string[] | null;
    engine: string;
    engine_version: string;
    payload: any;
    result?: { files?: FileResult[]; [key: string]: any; };
}
export interface FileResult {
    filename: string;
    url?: string;
}

export default class TasksResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    async get(id: string, query: { include: string; } | null = null): Promise<Task> {
        const response = await this.cloudConvert.axios.get('tasks/' + id, {
            params: query || {}
        });
        return response.data.data;
    }

    async wait(id: string): Promise<Task> {
        const response = await this.cloudConvert.axios.get('tasks/' + id + '/wait');
        return response.data.data;
    }

    async all(query: { 'filter[job_id]'?: string; 'filter[status]'?: TaskStatus; 'filter[operation]'?: Operation['operation']; per_page?: number; page?: number; } | null = null): Promise<Task[]> {
        const response = await this.cloudConvert.axios.get('tasks', {
            params: query || {}
        });
        return response.data.data;
    }

    async create<O extends Operation['operation']>(operation: O, data: Extract<Operation, { operation: O }>['data'] | null = null): Promise<Task> {
        const response = await this.cloudConvert.axios.post(operation, data);
        return response.data.data;
    }

    async delete(id: string): Promise<void> {
        await this.cloudConvert.axios.delete('tasks/' + id);
    }

    async upload(task: Task, stream: Stream): Promise<any> {

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

    async subscribeEvent(id: string, event: TaskEvent, callback: (event: TaskEventData) => void): Promise<void> {
        this.cloudConvert.subscribe('private-task.' + id, 'task.' + event, callback);
    }


}
