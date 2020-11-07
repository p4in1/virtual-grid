import {IVirtualGrid, IVirtualGridColumn, IVirtualGridRow} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridRow} from "./virtual.grid.row.model";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";

interface IVirtualStatusGroup {
    type: string
    col: IVirtualGridColumn
}

export class VirtualGridSortController {

    statusGroups: IVirtualStatusGroup[] = [];

    constructor(private Grid: IVirtualGrid, private config: VirtualGridConfigController) {

    }

    public sortColumn(col: IVirtualGridColumn, isMultiSelect: boolean, dir?: string): void {

        this.updateSorting(col, isMultiSelect, dir)

        if (this.statusGroups.length == 0) {
            this.resetGridRowIndexes();
            this.Grid.api.refreshGrid(true, true);
            return;
        }

        this.applySortGroupStatus()
    }

    public groupColumn(col: IVirtualGridColumn, addGroup = true): void {
        this.Grid.SelectionController.clearRangeSelection()

        if (addGroup) {
            this.statusGroups.push({type: "grouping", col})
        } else {
            for (let i = 0; i < this.statusGroups.length; i++) {
                let group = this.statusGroups[i]
                if (col.id == group.col.id) {
                    this.statusGroups.splice(i, 1)
                }
            }
        }

        let rowGroups = this.statusGroups.filter(x => x.type == "grouping")
        let sortGroups = this.statusGroups.filter(x => x.type == "sorting")

        // no status groups --> reset everything
        if (rowGroups.length === 0 && sortGroups.length === 0) {
            this.removeGroups()
            this.resetGridRowIndexes()
            this.Grid.api.refreshGrid(true, true);
            return
        }

        // in case the groups are empty now we have to remove the possible sorting of columns
        // because the sort order would persist in case it was sorted descending
        if (rowGroups.length === 0) {
            let group = this.statusGroups.find(x => x.col.isRowGroupColumn)
            if (group) {
                this.sortColumn(group.col, sortGroups.length > 1, "none")
                return;
            }
        }

        this.applySortGroupStatus()
    }

    private removeGroups() {
        let rows = []
        for (let row of this.Grid.rows) {
            if (!row.isRowGroup) {
                rows[rows.length] = row
            }
        }

        this.Grid.rows = rows
    }

    private updateSorting(col, isMultiSelect, dir) {
        let statusGroups = this.statusGroups
        // reset all columns --> there was a multi sort present but now its not
        if (!isMultiSelect) {
            let sortedCol = statusGroups.find(group => group.col.field === col.field)
            let sortGroups = statusGroups.filter(x => x.type == "sorting")

            // multi sort is present but this click is not with shift --> reset
            if (sortGroups.length > 1 || !sortedCol) {
                this.resetColumnSort()
            }
        }

        this.editSorting(col, isMultiSelect, dir);
    }

    private applySortGroupStatus() {
        let s = +new Date()
        let tree = {};


        if (this.statusGroups.length === 1) {
            let firstGroup = this.statusGroups[0]
            if (firstGroup.type == "sorting" && firstGroup.col.sortDirection == "desc") {
                this.Grid.rows.reverse()
                this.Grid.SelectionController.clearRangeSelection()
                this.Grid.api.refreshGrid(true, true);
                return
            }
        }

        for (let row of this.Grid.rows) {
            if (!row.isRowGroup) {
                this._addGroupRows(tree, row)
            }
        }

        console.log("grouping rows took -->", +new Date() - s)

        let rowGroups = this.statusGroups.filter(x => x.type == "grouping")
        let rows = this.getGroupedContent(tree, 0)

        if (rowGroups.length > 0) {
            this.generateTreeStructure(rows)

            rows = this.Grid.Utils.flatten(rows)
        }

        console.log("setting grouping / sorting status took -->", +new Date() - s)

        this.Grid.rows = rows
        this.Grid.SelectionController.clearRangeSelection()
        this.Grid.api.refreshGrid(true, true);
    }

    generateTreeStructure(rows, level: number = 0, parent?) {
        let childKey = this.config.childNodesKey
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i]
            let children = row[childKey]

            row[childKey] = []

            if (row.isRowGroup) {
                let virtualRow: IVirtualGridRow = new VirtualGridRow(this.Grid, row)

                rows[i] = virtualRow
            }

            rows[i][childKey] = children
            rows[i].parent = parent
            rows[i].level = level

            if (children && children.length > 0) {
                this.generateTreeStructure(children, level + 1, row)
            }
        }
    }

    private getGroupedContent(treePart, index) {
        let rows = []

        if (this.statusGroups[index].type == "sorting") {
            this._applySorting(treePart, rows, index)
        } else {
            this._applyGrouping(treePart, rows, index)
        }

        return rows
    }

    private _applySorting(treePart, rows, index) {
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
            let sortDir = currentGroup.col.sortDirection === "desc" ? -1 : currentGroup.col.sortDirection === "asc" ? 1 : 0

            let keys = Object.keys(treePart)
            if (keys.length > 1) {
                keys.sort((a, b) => {
                    return this.sortComparator(a, b, sortDir, currentGroup.col.colType)
                })
            }

            for (let key of keys) {
                for (let _row of treePart[key].children) {
                    rows[rows.length] = _row
                }
            }
        }

    }

    private _applyGrouping(treePart, rows, index) {
        let nextGroup = this.statusGroups[index + 1]

        // in case there is a sorting order for the grouping column
        // we use it while grouping .. this will speed up the process
        // the fallback is ascending sort, since the groups shall be displayed in this order
        let dir = 1;

        let group = this.statusGroups.find(x => x.col.isRowGroupColumn)
        if (group) {
            dir = group.col.sortDirection == "asc" ? 1 : group.col.sortDirection == "desc" ? -1 : 1
        }

        // sort the grouped keys by its name
        let keys = Object.keys(treePart).sort((a, b) => {
            return a.localeCompare(b) * dir
        })

        for (let key of keys) {
            let rowNode: any = {isRowGroup: true}
            let childKey = this.Grid.ConfigController.childNodesKey
            rowNode.value = key
            rowNode[childKey] = []

            rows.push(rowNode)

            if (nextGroup) {
                let groups = nextGroup.type == "grouping" ? treePart[key].rowGroups : treePart[key].sortGroups
                rowNode[childKey] = this.getGroupedContent(groups, index + 1)
            } else {
                for (let _row of treePart[key].children) {
                    rowNode[childKey].push(_row)
                }
            }
        }
    }


    private _addGroupRows(rowGroupTree, row: IVirtualGridRow) {
        let currentNode = rowGroupTree

        for (let i = 0; i < this.statusGroups.length; i++) {
            let currentGroup = this.statusGroups[i]

            let value = row.getCellValue(currentGroup.col, {suppressFormatting: true, stringify: false})

            if (currentGroup.type == "grouping" && value === "") {
                value = "[Empty]"
            }
            // deduplicate entries
            if (currentNode[value] == void 0) {
                currentNode[value] = {
                    children: [],
                    sortGroups: {},
                    rowGroups: {}
                }
            }

            // in case that the group is a row group
            let nextGroup = this.statusGroups[i + 1]
            if (nextGroup) {
                if (nextGroup.type == "sorting") {
                    currentNode = currentNode[value].sortGroups
                } else {
                    currentNode = currentNode[value].rowGroups
                }
            } else {
                currentNode[value].children.push(row)
            }
        }
    }

    private sortComparator(a: any, b: any, dir?: any, type?: string): number {
        dir = dir !== null ? dir : 1;

        switch (type) {
            case "boolean":
                a = !!a
                b = !!b
                break;
            case "number":
                a = a == void 0 || a == "" ? "" : +a
                b = b == void 0 || b == "" ? "" : +b
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

    private resetColumnSort() {
        for (let col of this.Grid.originalColumns) {
            this.resetGridRowIndexes();
            this.statusGroups = this.statusGroups.filter(x => x.type == "grouping")
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
            if (col.id == this.statusGroups[i].col.id && this.statusGroups[i].type == "sorting") {
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
