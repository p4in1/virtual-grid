export type BackgroundTaskStatus = 'STARTED' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'TERMINATED';

export interface BackgroundTask {
    id: string;
    jobs: BackgroundTaskJob[];
    status?: BackgroundTaskStatus;
}

export interface BackgroundTaskMessage {
    taskId: string;
    taskStatus: BackgroundTaskStatus;
}

export interface BackgroundTaskJob {
    id: string;
    name: string;
}
