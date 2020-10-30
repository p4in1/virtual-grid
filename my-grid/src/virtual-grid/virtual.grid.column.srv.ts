import {
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridRow
} from "./interfaces/virtual.grid.interfaces";

import {VirtualGridColumn} from "./virtual.grid.column.model";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";
import {VirtualGridUIDomController} from "./virtual.grid.ui.dom.srv";

/**
 * instance of column controller
 * everything related to columns goes into this class
 */
export class VirtualGridColumnController {
    public isVerticalScrolling: boolean = false;
    public scrollbarWidth: number = this.getScrollbarWidth();

    private sortConfig: any = {};

    public sortedColumns: IVirtualGridColumn[] = [];

    constructor(protected Grid: IVirtualGrid, private config: VirtualGridConfigController, private domController: VirtualGridUIDomController) {
    }

    setCurrentColumnIndex() {
        // give them the right currentIndex
        this.Grid.columns.forEach((col, index) => {
            col.currentIndex = index
        })
    }

    /**
     * refreshes the header and each header cell
     * replaces the header value or calls the headerValueGetter
     */
    public refreshColumns = (): void => {
        for (let column of this.Grid.originalColumns) {

            let headerValue: string = "";

            if (typeof (this.config.headerValueGetter) == "function") {
                headerValue = this.config.headerValueGetter({column, api: this.Grid.api});
            } else {
                headerValue = column.title;
            }

            column.dom.cellText.textContent = headerValue;
        }
    };

    /**
     * A sorting helper with functions to achieve multidimensional sorting over grid columns
     */
    private sortHelper: any = {
        keySort(a: any, b: any, dir?: any, type?: string): number {
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

                    a = !a ? "" : a.toString().toLowerCase()
                    b = !b ? "" : b.toString().toLowerCase()
                    return a.localeCompare(b) * dir;
            }

            return a == b ? 0 : a > b ? 1 * dir : -1 * dir;
        },

        /**
         * Sorts array of objects on keys as provided
         * @param array array of objects
         * @param sortObject object specifying keys, {KEY1:"asc", "KEY2:"desc", KEY3:"desc"}
         * @returns array of objects, sorted
         */
        multiSort: (array: any[], sortObject: any = {}): any[] => {

            const sortKeys: string[] = Object.keys(sortObject);

            // as yet poorly defined -- maybe sort on
            for (const k in sortObject) {
                // asc unless desc or skip
                sortObject[k].dir = sortObject[k].dir == "desc" || sortObject[k].dir == -1 ? -1 : sortObject[k].dir === 0 ? 0 : 1;
            }

            array.sort((a: IVirtualGridRow, b: IVirtualGridRow) => {
                let sorted: number = 0;
                let counter: number = 0;

                while (sorted === 0 && counter < sortKeys.length) {
                    const key: any = sortKeys[counter];
                    const dir: any = sortObject[key].dir;
                    const column: IVirtualGridColumn = sortObject[key].col
                    const colType: string = column.colType

                    let aVal = this.Grid.RowController.getCellData(a.rowData, key.split("."))
                    let bVal = this.Grid.RowController.getCellData(b.rowData, key.split("."))

                    if (typeof column.cellValueGetter == "function" && colType != "date") {

                        let cellA = {rowModel: a, colModel: column}
                        let cellB = {rowModel: b, colModel: column}

                        aVal = column.cellValueGetter(cellA, aVal)
                        bVal = column.cellValueGetter(cellB, bVal)
                    }

                    sorted = this.sortHelper.keySort(aVal, bVal, dir, colType);
                    counter++;
                }
                return sorted;
            });
            return array;
        }
    };

    /**
     * releases the resize detection
     */
    public destroy(): void {

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
        if (!isMultiSelect) {

            // find the column that has just been clicked. If the column is found, that means the user clicked the
            // same column and reverses the sort or resets it... otherwise the user clicks on another column
            // which results in a reset and a new sort with that column
            let sortedCol = this.sortedColumns.find(_col => _col.field === col.field)

            // multi sort is present but this click is not with shift --> reset
            if (Object.keys(this.sortConfig).length > 1 || !sortedCol) {
                this.resetColumnSort()
            }
        }

        this.editSorting(col, isMultiSelect, dir);

        this.sortConfig = {};

        if (this.sortedColumns.length == 0) {
            this.resetGridRowIndexes();
            this.Grid.api.refreshGrid(false, true);
            return;
        }

        for (const sortedColumn of this.sortedColumns) {
            this.sortConfig[sortedColumn.field] = {
                dir: sortedColumn.sortDirection,
                col: sortedColumn
            };
        }

        this.applySorting();
    }

    resetColumnSort() {
        for (let col of this.Grid.originalColumns) {
            this.resetGridRowIndexes();
            this.sortedColumns = [];
            col.sortDirection = null;
            col.dom.cellSortArrow.classList.remove("icon-asc");
            col.dom.cellSortArrow.classList.remove("icon-desc");
        }
    }

    /**
     * apply the current sorting to each row set
     */
    public applySorting(): void {
        let s = +new Date()

        let hierarchyColumn = this.Grid.columns.find(x => x.isHierarchyColumn)
        if (hierarchyColumn && hierarchyColumn.isVisible) {
            let roots: IVirtualGridRow[] = [];

            for (let row of this.Grid.rows) {
                if (row.level == 0) {
                    roots.push(row)
                }
            }

            this.sortAsTree(roots, this.sortConfig);

            this.Grid.rows = this.Grid.Utils.flatten(roots);
        } else {
            this.sortHelper.multiSort(this.Grid.rows, this.sortConfig);
        }

        console.log("sorting took -->", +new Date() - s)

        this.Grid.api.refreshGrid(false, true);
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
        this.resetGridRowIndexes();
        for (const i in this.sortedColumns) {
            const sortCol: any = this.sortedColumns[i];
            if (col.field == sortCol.field) {
                this.sortedColumns.splice(Number(i), 1)
            }
        }
    }

    private _sortAsc(col, isMultiSelect) {
        col.sortDirection = "asc";
        col.dom.cellSortArrow.classList.add("icon-asc");

        if (isMultiSelect) {
            this.sortedColumns.push(col)
        } else {
            this.sortedColumns = [col]
        }

    }

    private _sortDesc(col) {
        col.sortDirection = "desc";
        col.dom.cellSortArrow.classList.remove("icon-asc");
        col.dom.cellSortArrow.classList.add("icon-desc");

        let column = this.sortedColumns.find(c => c.currentIndex == col.currentIndex)

        if (column) {
            for (let sortCol of this.sortedColumns) {
                if (col.field == sortCol.field) {
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
     * @param sortObject
     */
    private sortAsTree(rows: IVirtualGridRow[], sortObject) {

        this.sortHelper.multiSort(rows, sortObject);

        for (let row of rows) {
            if (row.children) {
                this.sortAsTree(row.children, sortObject)
            }
        }
    }

    /**
     * creates column models ... *duh*
     */
    public createColumnModels() {

        let columns: IVirtualGridColumn[] = [];

        this.config.colDefs.forEach((col, index) => {
            columns.push(new VirtualGridColumn(this.Grid, col, index))
        })

        return columns
    }

    private getScrollbarWidth() {
        const inner = document.createElement('p');
        inner.style.width = "100%";
        inner.style.height = "200px";

        let outer = document.createElement('div');
        outer.style.position = "absolute";
        outer.style.top = "0px";
        outer.style.left = "0px";
        outer.style.visibility = "hidden";
        outer.style.width = "200px";
        outer.style.height = "150px";
        outer.style.overflow = "hidden";
        outer.append(inner);

        this.domController.dom.virtualGrid.append(outer);
        const w1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        let w2 = inner.offsetWidth;
        if (w1 == w2) w2 = outer.clientWidth;

        this.domController.dom.virtualGrid.removeChild(outer);

        return (w1 - w2);
    }

    /**
     * this only calculates the width of each column but does not alter the css value of the header cell
     *
     * if the columns shall be auto sized we calculate the approx. width by the width of the content using the Form layout Service
     * otherwise we divide the available width by the columns given
     */
    public calculateColumnWidth(): void {

        // the grid now has a scrollbar, so we have to create some space
        if ((this.Grid.rows.length - 1) * this.config.rowHeight > this.domController.dom.virtualGrid.offsetHeight) {
            this.isVerticalScrolling = true;
        }

        let availableWidth: number = this.domController.dom.virtualGrid.clientWidth;
        let upsizedColumns: number = 0; // we count the columns without a predefined width

        if (this.isVerticalScrolling) {
            availableWidth -= this.scrollbarWidth
        }

        // first we need to find the maximum depth if the grid has tree columns
        // this is needed because the tree column will grow with each increase in depth by 16px
        // this has to be added onto the column size
        for (const col of this.Grid.originalColumns) {

            if (!col.isVisible) {
                col.width = col.width == void 0 ? 0 : col.width
                continue
            }

            if (col.width !== void 0) {
                availableWidth -= col.width
            } else {
                upsizedColumns++;
            }
        }

        if (upsizedColumns > 0) {
            // there are columns without a defined width so we even the available space out down to the minimum of 40px
            for (let i = 0; i < this.Grid.originalColumns.length; i++) {
                let col = this.Grid.originalColumns[i];

                if (!col.isVisible) {
                    continue
                }

                if (col.width === void 0) {
                    const width: number = Math.floor((availableWidth) / upsizedColumns);

                    col.width = width < col.minWidth ? col.minWidth : width;
                    col.width = Math.round(col.width)
                }
            }
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
