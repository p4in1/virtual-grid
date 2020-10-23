
export interface WorkerActionListener {
    sort: (payload:any) => void;
    group: (payload:any) => void;
    filter: (payload:any) => void;
}
