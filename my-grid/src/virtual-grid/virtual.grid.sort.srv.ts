import {IVirtualGrid, IVirtualGridColumn, IVirtualGridRow} from "./interfaces/virtual.grid.interfaces";

interface IVirtualStatusGroup {
    type: string
    col: IVirtualGridColumn
}

export class VirtualGridSortController {

    statusGroups: IVirtualStatusGroup[] = [];

    constructor(private Grid: IVirtualGrid) {

    }

    public sortColumn(col: IVirtualGridColumn, isMultiSelect: boolean, dir?: string): void {

        this.updateSorting(col, isMultiSelect, dir)

        if (this.statusGroups.length == 0) {
            this.resetGridRowIndexes();
            this.Grid.api.refreshGrid(false, true);
            return;
        }

        let s = +new Date()
        let tree = {};

        for (let row of this.Grid.rows) {
            if (!row.isRowGroup) {
                this._addGroupRows(tree, row)
            }
        }

        console.log("grouping took -->", +new Date() - s)
        s = +new Date()
        this.applySorting(tree)
        console.log("sorting keys took -->", +new Date() - s)
        //
        // let rows = [];
        // for (let key of keys) {
        //     for (let child of tree[key].children) {
        //         rows.push(child)
        //     }
        // }


    }

    updateSorting(col, isMultiSelect, dir) {
        // reset all columns --> there was a multi sort present but now its not
        if (!isMultiSelect) {
            let sortedCol = this.statusGroups.find(group => group.col.field === col.field)
            let sortGroups = this.statusGroups.filter(x => x.type == "sorting")

            // multi sort is present but this click is not with shift --> reset
            if (sortGroups.length > 1 || !sortedCol) {
                this.statusGroups = this.statusGroups.filter(x => x.type == "grouping")
                this.resetColumnSort()
            }
        }

        this.editSorting(col, isMultiSelect, dir);
    }

    applySorting(treePart) {
        let rows = []
        let sortGroups = this.statusGroups.filter(x => x.type == "sorting")
        let groupingGroups = this.statusGroups.filter(x => x.type == "grouping")

        // if (group.type == "sorting") {

        rows = this.getGroupedContent(treePart, 0)

        // for (let key of keys) {
        //     for (let _row of treePart[key].children) {
        //         rows[rows.length] = _row
        //     }
        //
        // }

        // } else {
        //
        //     let keys = Object.keys(treePart).sort((a, b) => {
        //         return a.localeCompare(b)
        //     })
        //
        //     for (let key of keys) {
        //         let rowNode: any = {isRowGroup: true}
        //         let childKey = this.Grid.ConfigController.childNodesKey
        //         rowNode.value = key
        //         rowNode[childKey] = []
        //
        //         rows.push(rowNode)
        //
        //         if (Object.keys(treePart[key].rowGroups).length > 0) {
        //             // rowNode[childKey] = this._createGroupRows(treePart[key].rowGroups)
        //         } else {
        //             for (let _row of treePart[key].children) {
        //                 rowNode[childKey].push(_row.rowData)
        //             }
        //         }
        //     }
        // }

        this.Grid.rows = rows
        this.Grid.api.refreshGrid(false, true);
        return rows
    }

    getGroupedContent(treePart, index) {
        let rows = []
        let currentGroup = this.statusGroups[index]
        let nextGroup = this.statusGroups[index + 1]
        if (nextGroup && nextGroup.type == "sorting") {
            let keys = Object.keys(treePart)
            for (let key of keys) {
                let _rows = this.getGroupedContent(treePart[key].sortGroups, index + 1)
                _rows.forEach((row) => {
                    rows[rows.length] = row
                })
            }

        } else {
            let keys = Object.keys(treePart)
            let sortDir = currentGroup.col.sortDirection === "desc" ? -1 : currentGroup.col.sortDirection === "asc" ? 1 : 0

            keys.sort((a, b) => {
                return this.sortComparator(a, b, sortDir, currentGroup.col.colType)
            })

            for (let key of keys) {
                for (let _row of treePart[key].children) {
                    rows[rows.length] = _row
                }
            }
        }

        return rows
    }


    _addGroupRows(rowGroupTree, row) {
        let currentNode = rowGroupTree

        for (let i = 0; i < this.statusGroups.length; i++) {
            let currentGroup = this.statusGroups[i]
            let value = row.getCellValue(currentGroup.col)

            // deduplicate entries
            if (currentNode[value] == void 0) {
                currentNode[value] = {
                    children: [],
                    sortGroups: {},
                    rowGroups: {}
                }
            }

            currentNode[value].children[currentNode[value].children.length] = row

            // in case that the group is a row group
            let nextGroup = this.statusGroups[i + 1]
            if (nextGroup) {
                if (nextGroup.type == "sorting") {
                    currentNode = currentNode[value].sortGroups
                } else {
                    currentNode = currentNode[value].rowGroups
                }
            }
        }
    }

    sortComparator(a: any, b: any, dir?: any, type?: string): number {
        dir = dir !== null ? dir : 1;

        switch (type) {
            case "boolean":
                a = !!a
                b = !!b
                break;
            case "date":
                a = !a ? "" : a
                b = !b ? "" : b
                break;
            case "multiLine":
            case "text":
                if (type === "multiLine") {
                    a = a[0]
                    b = b[0]
                }

                a = !a ? "" : a
                b = !b ? "" : b
                return a.localeCompare(b) * dir;
        }

        return a == b ? 0 : a > b ? 1 * dir : -1 * dir;
    }

    resetColumnSort() {
        for (let col of this.Grid.originalColumns) {
            this.resetGridRowIndexes();
            this.statusGroups = [];
            col.sortDirection = null;
            col.dom.cellSortArrow.classList.remove("icon-asc");
            col.dom.cellSortArrow.classList.remove("icon-desc");
        }
    }

    /**
     * edits the sort property of the given column definition and changes the html class of the arrow
     *
     * @param col
     * @param {boolean} isMultiSelect
     * @param {string} dir - asc, desc, none
     */
    private editSorting(col: IVirtualGridColumn, isMultiSelect: boolean, dir?): void {

        if (dir) {
            dir == "asc" && this._sortAsc(col)
            dir == "desc" && this._sortDesc(col)
            dir == "none" && this._sortNone(col)
        } else {
            let sortDir = col.sortDirection

            sortDir == "desc" && this._sortNone(col)
            sortDir == "asc" && this._sortDesc(col)
            sortDir == void 0 && this._sortAsc(col)
        }
    }

    private _sortNone(col: IVirtualGridColumn) {
        col.sortDirection = null;
        col.dom.cellSortArrow.classList.remove("icon-desc");
        this.resetGridRowIndexes();

        for (let i = 0; i < this.statusGroups.length; i++) {
            if (col.id == this.statusGroups[i].col.id) {
                this.statusGroups.splice(i, 1)
                return
            }
        }
    }

    private _sortAsc(col) {
        col.sortDirection = "asc";
        col.dom.cellSortArrow.classList.add("icon-asc");

        this.statusGroups.push({type: "sorting", col})
    }

    private _sortDesc(col) {
        col.sortDirection = "desc";
        col.dom.cellSortArrow.classList.remove("icon-asc");
        col.dom.cellSortArrow.classList.add("icon-desc");

        let column = this.statusGroups.find(c => c.col.currentIndex == col.currentIndex)
        if (column) {
            for (let sortCol of this.statusGroups) {
                if (col.field == sortCol.col.field) {
                    sortCol = col;
                }
            }
        } else {
            this.statusGroups.push({col, type: "sorting"})
        }
    }


    /**
     * resets the indexes of the grid rows to the initial value
     */
    private resetGridRowIndexes() {
        let orderedRows: IVirtualGridRow[] = [];
        for (let row of this.Grid.rows) {
            orderedRows[row.initialIndex] = row;
            row.index = row.initialIndex
        }

        this.Grid.rows = orderedRows;
    }
}
