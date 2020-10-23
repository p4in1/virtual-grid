import {BackgroundWorker} from "./background-worker";
import {WorkerActionListener} from "./background-worker.model";
import {IVirtualGrid} from "../interfaces/virtual.grid.interfaces";

export class WorkerService {

    workers: Worker[] = []

    constructor(private Grid: IVirtualGrid) {
        let rowCount = this.Grid.rows.length
        let workerCount;
         if (rowCount > 500000) {
            workerCount = 8
        } else if (rowCount > 250000) {
            workerCount = 6
        } else {
            workerCount = 4
        }

        for (let i = 0; i < workerCount; i++) {
            this.workers.push(new Worker(this.createWorkerUrl()));
        }
    }

    private createWorkerTemplate(): string {
        return `var worker = new ${BackgroundWorker.toString()}();`;
    }

    private createWorkerUrl(): string {
        const webWorkerTemplate = `
        ${this.createWorkerTemplate()}
        self.addEventListener('message', function(event) {
          (function ${this.workerListener.toString()})(worker, event.data.action, event.data.payload);
        });
    `;
        const blob = new Blob([webWorkerTemplate], {type: 'text/javascript'});
        return URL.createObjectURL(blob);
    }

    private workerListener(worker: WorkerActionListener, action: string, payload: any) {

        switch (action) {
            case 'sort':
                worker.sort(payload);
                break;
            case 'filter':
                worker.filter(payload);
                break;
            case 'group':
                worker.group(payload);
                break;
            default:
                break;
        }
    }

    startTask(worker, task, payload): Promise<any> {
        return this.createWorkerObservableForTask(worker, task, payload);
    }

    private notify(worker, action: string, payload?: any) {
        worker.postMessage({action, payload});
    }

    private createWorkerObservableForTask(worker: Worker, task, payload) {
        return new Promise((resolve) => {
            worker.addEventListener('message', event => {
                resolve(event.data);
            });

            this.notify(worker, task, payload);
        })
    }
}
