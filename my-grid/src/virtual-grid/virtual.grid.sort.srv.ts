import {IVirtualGrid, IVirtualGridColumn, IVirtualGridRow} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";

interface IVirtualSortColumn {
    col: IVirtualGridColumn,
    isChanged: boolean
}

export class VirtualGridSortController {
    public sortedColumns: IVirtualSortColumn[] = [];

    constructor(private Grid: IVirtualGrid, private config: VirtualGridConfigController) {

    }

    /**
     * sorts the column ascending or descending
     * if the user holds the shift key the grid starts to sort multidimensional
     *
     * @param col - the column definition of the column to sort
     * @param {boolean} isMultiSelect
     * @param {string} dir - asc, desc, none
     */
    public sortColumn(col: IVirtualGridColumn, isMultiSelect: boolean, dir?: string): void {
        // reset all columns --> there was a multi sort present but now its not
        if (this.sortedColumns.length > 0 && !isMultiSelect) {

            // find the column that has just been clicked. If the column is found, that means the user clicked the
            // same column and reverses the sort or resets it... otherwise the user clicks on another column
            // which results in a reset and a new sort with that column
            let sortedCol = this.sortedColumns.find(_sortCol => _sortCol.col.field === col.field)

            // multi sort is present but this click is not with shift --> reset
            if (this.sortedColumns.length > 1 || !sortedCol) {
                this.resetColumnSort()
            }
        }

        this.editSorting(col, isMultiSelect, dir);

        if (this.sortedColumns.length == 0) {
            this.Grid.RowController.resetGridRowIndexes();
            this.Grid.api.refreshGrid(false, true);
            return;
        }

        this.applySorting();
    }


    resetColumnSort() {
        for (let col of this.Grid.originalColumns) {
            this.sortedColumns = [];
            col.sortDirection = null;
            col.dom.cellSortArrow.classList.remove("icon-asc");
            col.dom.cellSortArrow.classList.remove("icon-desc");
        }

        this.Grid.RowController.resetGridRowIndexes();
    }

    /**
     * apply the current sorting to each row set
     */
    public applySorting(suppressRefresh = false): void {
        let s = +new Date()

        let hierarchyColumn = this.Grid.columns.find(x => x.isHierarchyColumn)
        if (hierarchyColumn && hierarchyColumn.isVisible) {
            let roots: IVirtualGridRow[] = [];

            for (let row of this.Grid.rows) {
                if (row.level == 0) {
                    roots.push(row)
                }
            }

            this.sortAsTree(roots);

            this.Grid.rows = this.Grid.Utils.flatten(roots);
        } else {
            this.multiSort(this.Grid.rows)
        }

        console.log("sorting took -->", +new Date() - s)

        this.Grid.rows.forEach((row, index) => {
            row.index = index
        })

        if (!suppressRefresh) {
            this.Grid.api.refreshGrid(false, true);
        }
    }

    multiSort(rows: IVirtualGridRow[], index = 0) {
        let sortCol = this.sortedColumns[index]
        let nextCol = this.sortedColumns[index + 1]

        if (sortCol.isChanged) {
            if (index === 0) {
                let _rows = this._sortRows(rows, sortCol)

                for (let i = 0; i < rows.length; i++) {
                    rows[i] = _rows[i]
                }
            } else {

                let currentValue = rows[0].value
                let currentRows = []
                let startIndex = 0
                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i]
                    if (row.value != currentValue) {

                        let _rows = this._sortRows(currentRows, sortCol)

                        for (let _row of _rows) {
                            rows[startIndex] = _row
                            startIndex++
                        }

                        if (rows[i + 1]) {
                            currentValue = rows[i + 1].value
                            startIndex = i + 1
                        }

                        currentRows = []

                        continue
                    }

                    currentRows.push(row)
                }
            }
        }

        if (nextCol && rows.length > 0) {
            this.multiSort(rows, index + 1)
        }
    }

    _sortRows(rows: IVirtualGridRow[], sortCol: IVirtualSortColumn) {
        let values = []
        let dir = sortCol.col.sortDirection == "asc" ? 1 : sortCol.col.sortDirection == "desc" ? -1 : 0
        for (let row of rows) {
            row.value = row.getCellValue(sortCol.col, {stringify: false, format: false})
            values.push({value: row.value, row})
        }

        values.sort((a, b) => {
            return this.sortComp(a.value, b.value, dir, sortCol.col.colType)
        })

        let _rows = []

        for (let item of values) {
            _rows.push(item.row)
        }

        return _rows
    }

    sortComp(a: any, b: any, dir?: any, type?: string): number {

        if (a === b) {
            return 0
        }
        if (a == void 0 || a === "") {
            return -1 * dir
        }

        if (b == void 0 || b === "") {
            return dir
        }

        // noinspection FallThroughInSwitchStatementJS
        switch (type) {
            case "boolean":
                a = !!a
                b = !!b
                break;
            case "number":
                return dir === 1 ? a - b : b - a
            case "date":
                a = !a ? "" : a
                b = !b ? "" : b
                break;
            case "multiLine":
                a = a[0]
                b = b[0]
            case "text":

                a = typeof a === "string" ? a : a.toString()
                b = typeof b === "string" ? b : b.toString()
                return a.localeCompare(b) * dir;
        }

        return a == b ? 0 : a > b ? 1 * dir : -1 * dir;
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
            dir == "asc" && this._sortAsc(col, isMultiSelect)
            dir == "desc" && this._sortDesc(col)
            dir == "none" && this._sortNone(col)
        } else {
            let sortDir = col.sortDirection

            sortDir == "desc" && this._sortNone(col)
            sortDir == "asc" && this._sortDesc(col)
            sortDir == void 0 && this._sortAsc(col, isMultiSelect)
        }
    }

    private _sortNone(col) {
        col.sortDirection = null;
        col.dom.cellSortArrow.classList.remove("icon-desc");

        for (const i in this.sortedColumns) {
            const sortCol: IVirtualSortColumn = this.sortedColumns[i];
            if (col.field == sortCol.col.field) {
                this.sortedColumns.splice(Number(i), 1)
            }
        }

        if (this.sortedColumns.length) {
            this.Grid.RowController.resetGridRowIndexes();
        }
    }

    private _sortAsc(col, isMultiSelect) {
        col.sortDirection = "asc";
        col.dom.cellSortArrow.classList.add("icon-asc");

        if (isMultiSelect) {
            this.sortedColumns.push({col, isChanged: true})
        } else {
            this.sortedColumns = [{col, isChanged: true}]
        }

    }

    private _sortDesc(col) {
        col.sortDirection = "desc";
        col.dom.cellSortArrow.classList.remove("icon-asc");
        col.dom.cellSortArrow.classList.add("icon-desc");

        let column = this.sortedColumns.find(c => c.col.currentIndex == col.currentIndex)

        if (column) {
            for (let sortCol of this.sortedColumns) {
                if (col.field == sortCol.col.field) {
                    sortCol = col;
                }
            }
        } else {
            this.sortedColumns.push(col)
        }
    }

    /**
     * helper function to sort the grid elements as a tree
     * it sorts each subsequent child set of a row recursively
     * @param rows
     */
    private sortAsTree(rows: IVirtualGridRow[]) {

        this.multiSort(rows)

        for (let row of rows) {
            if (row.children) {
                this.sortAsTree(row.children)
            }
        }
    }
}
