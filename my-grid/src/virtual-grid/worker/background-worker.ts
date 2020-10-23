declare function postMessage(message: any): void;

export class BackgroundWorker {

    constructor() {
    }

    sort = (payload: any) => {
        payload.sort((a, b) => {
            return a.localeCompare(b)
        })

        postMessage(payload)
    }

    filter = (payload: any) => {
        console.log("stuff from worker", payload)
    }

    group = (payload: any) => {
        console.log("stuff from worker", payload)
    }
}
