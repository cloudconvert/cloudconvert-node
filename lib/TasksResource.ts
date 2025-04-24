import CloudConvert, {
    UploadFile,
    type UploadFileSource
} from './CloudConvert';
import { type JobTask } from './JobsResource';

export type TaskEvent = 'created' | 'updated' | 'finished' | 'failed';
export type TaskStatus = 'waiting' | 'processing' | 'finished' | 'error';

export interface TaskEventData {
    task: Task;
}

export interface JobTaskEventData {
    task: JobTask;
}

export type Operation = ImportOperation | TaskOperation | ExportOperation;
export type ImportOperation =
    | ImportUrl
    | ImportUpload
    | ImportBase64
    | ImportRaw
    | ImportS3
    | ImportAzureBlob
    | ImportGoogleCloudStorage
    | ImportOpenStack
    | ImportSFTP;
export type TaskOperation =
    | TaskConvert
    | TaskOptimize
    | TaskWaterMark
    | TaskCapture
    | TaskThumbnail
    | TaskMerge
    | TaskArchive
    | TaskCommand
    | TaskMetadata
    | TaskMetadataWrite;
export type ExportOperation =
    | ExportUrl
    | ExportS3
    | ExportAzureBlob
    | ExportGoogleCloudStorage
    | ExportOpenStack
    | ExportSFTP;

interface ImportUrl {
    operation: 'import/url';
    data: ImportUrlData;
}

export interface ImportUrlData {
    url: string;
    filename?: string;
    headers?: { [key: string]: string };
}

interface ImportUpload {
    operation: 'import/upload';
    data: ImportUploadData;
}

export interface ImportUploadData {
    redirect?: string;
}

interface ImportBase64 {
    operation: 'import/base64';
    data: ImportBase64Data;
}

export interface ImportBase64Data {
    file: string;
    filename: string;
}

interface ImportRaw {
    operation: 'import/raw';
    data: ImportRawData;
}

export interface ImportRawData {
    file: string;
    filename: string;
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
    timeout?: number;

    [option: string]: any;
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
    timeout?: number;
    quality?: number;
    profile?: 'web' | 'print' | 'archive' | 'mrc' | 'max';

    [option: string]: any;
}

interface TaskWaterMark {
    operation: 'watermark';
    data: TaskWaterMarkData;
}

export interface TaskWaterMarkData {
    input?: string | string[];
    input_format?: string;
    pages?: string;
    layer?: 'above' | 'below';
    text?: string;
    font_size?: number;
    font_width_percent?: number;
    font_color?: string;
    font_name?:
        | 'Andale Mono'
        | 'Arial'
        | 'Arial Black'
        | 'Arial Bold'
        | 'Arial Bold Italic'
        | 'Arial Italic'
        | 'Courier New'
        | 'Courier New Bold'
        | 'Courier New Bold Italic'
        | 'Courier New Italic'
        | 'Georgia'
        | 'Georgia Bold'
        | 'Georgia Bold Italic'
        | 'Georgia Italic'
        | 'Helvetica'
        | 'Helvetica Bold'
        | 'Helvetica BoldOblique'
        | 'Helvetica Narrow Bold'
        | 'Helvetica Narrow BoldOblique'
        | 'Helvetica Oblique'
        | 'Impact'
        | 'Times New Roman'
        | 'Times New Roman Bold'
        | 'Times New Roman Bold Italic'
        | 'Times New Roman Italic'
        | 'Trebuchet MS'
        | 'Trebuchet MS Bold'
        | 'Trebuchet MS Bold Italic'
        | 'Trebuchet MS Italic'
        | 'Verdana'
        | 'Verdana Bold'
        | 'Verdana Bold Italic'
        | 'Verdana Italic';
    font_align?: 'left' | 'center' | 'right';
    image?: string;
    image_width?: number;
    image_height?: number;
    image_width_percent?: number;
    position_vertical?: 'top' | 'center' | 'bottom';
    position_horizontal?: 'left' | 'center' | 'right';
    margin_vertical?: number;
    margin_horizontal?: number;
    opacity?: number;
    rotation?: number;
    filename?: string;
    engine?: string;
    engine_version?: string;
    timeout?: number;

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
    timeout?: number;
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
    headers?: { [header: string]: string };
}

interface TaskThumbnail {
    operation: 'thumbnail';
    data: TaskThumbnailData;
}

export interface TaskThumbnailData {
    input: string | string[];
    input_format?: string;
    output_format: 'png' | 'webp' | 'jpg';
    width?: number;
    height?: number;
    fit?: 'max' | 'crop' | 'scale';
    count?: number;
    timestamp?: string;
    filename?: string;
    engine?: string;
    engine_version?: string;
    timeout?: number;

    [option: string]: any;
}

interface TaskMetadata {
    operation: 'metadata';
    data: TaskMetadataData;
}

export interface TaskMetadataData {
    input: string | string[];
    input_format?: string;
    engine?: string;
    engine_version?: string;
    timeout?: number;

    [option: string]: any;
}

interface TaskMetadataWrite {
    operation: 'metadata/write';
    data: TaskMetadataWriteData;
}

export interface TaskMetadataWriteData {
    input: string | string[];
    input_format?: string;
    engine?: string;
    engine_version?: string;
    metadata: Record<string, string | number>;
    filename?: string;
    timeout?: number;

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
    timeout?: number;
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
    timeout?: number;
}

interface TaskCommand {
    operation: 'command';
    data: TaskCommandData;
}

interface TaskCommandBaseData {
    input: string | string[];
    engine_version?: string;
    capture_output?: boolean;
    timeout?: number;
    arguments: string;
}

interface TaskCommandFfmpegData extends TaskCommandBaseData {
    engine: 'ffmpeg';
    command: 'ffmpeg' | 'ffprobe';
}

interface TaskCommandGraphicsmagickData extends TaskCommandBaseData {
    engine: 'graphicsmagick';
    command: 'gm';
}

interface TaskCommandImagemagickData extends TaskCommandBaseData {
    engine: 'imagemagick';
    command: 'convert' | 'identify';
}

export type TaskCommandData =
    | TaskCommandFfmpegData
    | TaskCommandGraphicsmagickData
    | TaskCommandImagemagickData;

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
    acl?:
        | 'private'
        | 'public-read'
        | 'public-read-write'
        | 'authenticated-read'
        | 'bucket-owner-read'
        | 'bucket-owner-full-control';
    cache_control?: string;
    metadata?: Record<string, unknown>;
    server_side_encryption?: string;
    tagging?: Record<string, string>;
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
    depends_on_tasks: { [task: string]: string };
    retry_of_task_id?: string | null;
    retries?: string[] | null;
    engine: string;
    engine_version: string;
    payload: any;
    result?: { files?: FileResult[]; [key: string]: any };
}

export interface FileResult {
    dir?: string;
    filename: string;
    url?: string;
    size?: number;
}

export default class TasksResource {
    private readonly cloudConvert: CloudConvert;

    constructor(cloudConvert: CloudConvert) {
        this.cloudConvert = cloudConvert;
    }

    async get(id: string, query?: { include?: string }): Promise<Task> {
        return await this.cloudConvert.call('GET', `tasks/${id}`, query);
    }

    async wait(id: string): Promise<Task> {
        const baseURL = this.cloudConvert.useSandbox
            ? 'https://sync.api.sandbox.cloudconvert.com/v2/'
            : `https://${
                  this.cloudConvert.region ? this.cloudConvert.region + '.' : ''
              }sync.api.cloudconvert.com/v2/`;
        return await this.cloudConvert.callWithBase(
            baseURL,
            'GET',
            `tasks/${id}`
        );
    }

    async cancel(id: string): Promise<Task> {
        return await this.cloudConvert.call('POST', `tasks/${id}/cancel`);
    }

    async all(query?: {
        'filter[job_id]'?: string;
        'filter[status]'?: TaskStatus;
        'filter[operation]'?: Operation['operation'];
        per_page?: number;
        page?: number;
    }): Promise<Task[]> {
        return await this.cloudConvert.call('GET', 'tasks', query);
    }

    async create<O extends Operation['operation']>(
        operation: O,
        data?: Extract<Operation, { operation: O }>['data']
    ): Promise<Task> {
        return await this.cloudConvert.call('POST', operation, data);
    }

    async delete(id: string): Promise<void> {
        await this.cloudConvert.call('DELETE', `tasks/${id}`);
    }

    async upload(
        task: Task | JobTask,
        stream: UploadFileSource,
        filename?: string,
        fileSize?: number
    ): Promise<any> {
        if (task.operation !== 'import/upload') {
            throw new Error('The task operation is not import/upload');
        }

        if (task.status !== 'waiting' || !task.result || !task.result.form) {
            throw new Error('The task is not ready for uploading');
        }

        const uploadFile = new UploadFile(stream, filename, fileSize);
        for (const parameter in task.result.form.parameters) {
            uploadFile.add(parameter, task.result.form.parameters[parameter]);
        }

        return await this.cloudConvert.call(
            'POST',
            task.result.form.url,
            uploadFile,
            { presigned: true, flat: true }
        );
    }

    async subscribeEvent(
        id: string,
        event: TaskEvent,
        callback: (event: TaskEventData) => void
    ): Promise<void> {
        this.cloudConvert.subscribe(
            `private-task.${id}`,
            `task.${event}`,
            callback
        );
    }
}
