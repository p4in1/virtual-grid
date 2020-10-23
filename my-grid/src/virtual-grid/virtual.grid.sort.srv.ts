import {
    IVirtualGrid, IVirtualGridColumn,
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";

/**
 * instance of column controller
 * everything related to columns goes into this class
 */
export class VirtualGridSortController {

    sortGroups: IVirtualGridColumn[] = [];

    constructor(protected Grid: IVirtualGrid, private config: VirtualGridConfigController) {

    }

    sortColumn(col: IVirtualGridColumn, event) {
        let s = +new Date()
        let tree = {};
        let values = []
        this.sortGroups = []
        this.sortGroups.push(col)
        for (let row of this.Grid.rows) {
            if (!row.isRowGroup) {
                this._addGroupRows(tree, row, this.sortGroups)
                // values.push(row.getCellValue(col))
            }
        }

        console.log("grouping took -->", +new Date() - s)
        s = +new Date()
        let keys = Object.keys(tree)
        console.log("generating keys took -->", +new Date() - s)
        s = +new Date()

        keys.sort((a, b) => {
            return a.localeCompare(b)
        })
        console.log("sorting in one thread took -->", +new Date() - s)
        //
        // let workerCount = this.Grid.WorkerController.workers.length
        // let parts = [];
        //
        //
        //
        // parts.push(keys.slice(0, keys.length / (workerCount + 1)))
        //
        // for (let i = 0; i < workerCount; i++) {
        //     if (i + 1 == workerCount) {
        //         parts[i] = keys.slice(i * keys.length / workerCount)
        //     } else {
        //         parts[i] = keys.slice(i * (keys.length / workerCount), (i + 1) * keys.length / workerCount)
        //     }
        // }
        //
        // let promises = []
        // // let promise = new Promise((resolve) => {
        // //     parts[0].sort((a, b) => {
        // //         return a.localeCompare(b)
        // //     })
        // //     resolve(parts[0])
        // // })
        //
        // // promises.push(promise)
        //
        // for (let i = 0; i < this.Grid.WorkerController.workers.length; i++) {
        //     promises.push(this.Grid.WorkerController.startTask(this.Grid.WorkerController.workers[i], "sort", parts[i]))
        // }
        //
        //
        // Promise.all(promises).then((res) => {
        //     let sortedKeys = []
        //
        //     for (let part of res) {
        //         for (let item of part) {
        //             sortedKeys.push(item)
        //         }
        //     }
        //
        //     console.log("sorting done after --> ", +new Date() - s)
        //
        //     let rows = [];
        //     for (let key of sortedKeys) {
        //         for (let child of tree[key].children) {
        //             rows.push(child)
        //         }
        //     }
        //
        //     this.Grid.rows = rows
        //     this.Grid.api.refreshGrid(false, true);
        // })
    }

    _addGroupRows(rowGroupTree, row, groups) {
        let currentNode = rowGroupTree

        for (let i = 0; i < groups.length; i++) {
            let currentGroup = groups[i]
            let value = row.getCellValue(currentGroup)

            if (currentNode[value] == void 0) {
                currentNode[value] = {
                    children: [],
                    rowGroups: {}
                }
            }

            currentNode[value].children[currentNode[value].children.length] = row

            if (i !== groups.length - 1) {
                currentNode = currentNode[value].rowGroups
            }
        }
    }
}
