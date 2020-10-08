import {IVirtualGrid, IVirtualGridColumn, IVirtualGridRow} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridColumn} from "./virtual.grid.column.model";

/**
 * instance of column controller
 * everything related to columns goes into this class
 */
export class VirtualGridColumnController {
    public isVerticalScrolling: boolean = false;
    public scrollbarWidth: number = 17;

    private colDefs: any[] = [];
    private sortConfig: any = {};
    private gPadding: number = 16;

    private headerValueGetter: any;
    private autoSizeColumns: boolean;
    private isGridHierarchy: boolean = false;
    private truncateCellContent: boolean = true;
    private minWidth: any = 0;
    private width: any = 0;

    public sortedColumns: IVirtualGridColumn[];
    public minimumColumnWidth: number = 60;

    constructor(protected Grid: IVirtualGrid, config: any) {

        this.colDefs = config.columns.slice();
        this.headerValueGetter = config.headerValueGetter;
        this.autoSizeColumns = config.autoSizeColumns;
        this.minWidth = config.minWidth;
        this.width = config.width;
        this.sortedColumns = [];
        this.truncateCellContent = config.truncateCellContent != void 0 ? config.truncateCellContent : true;

        this.scrollbarWidth = this.getScrollbarWidth()

        for (let col of config.columns) {
            if (col.showAsTree) {
                this.isGridHierarchy = true;
            }
        }
    }

    setCurrentColumnIndex() {
        // give them the right currentIndex
        this.Grid.columns.forEach((col, index) => {
            col.currentIndex = index
        })
    }

    /**
     * updates the config properties
     * @param config
     */
    public updateConfigProperties = (config: any): void => {
        this.colDefs = config.columns;
        this.headerValueGetter = config.headerValueGetter;
        this.autoSizeColumns = config.autoSizeColumns;
        this.minWidth = config.minWidth;
        this.width = config.width;
        this.truncateCellContent = config.truncateCellContent != void 0 ? config.truncateCellContent : true
    };

    /**
     * refreshes the header and each headercell
     * replaces the headervalue or calls the headerValueGetter
     */
    public refreshColumns = (): void => {
        for (let column of this.Grid.originalColumns) {

            let headerValue: string = "";

            if (this.headerValueGetter && typeof (this.headerValueGetter) == "function") {
                headerValue = this.headerValueGetter({column, api: this.Grid.api});
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

                    a = !a ? "" : a.toString()
                    b = !b ? "" : b.toString()
                    return a.localeCompare(b) * dir;
            }

            return a == b ? 0 : a > b ? 1 * dir : -1 * dir;
        },

        /**
         * Sorts array of objects on keys as provided
         * @param array array of objects
         * @param sortObject object specifying keys, {KEY1:"asc", "KEY2:"desc", KEY3:"desc"}, also {KEYX:"skip"} for fun
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
     * @param col - the column definiton of the column to sort
     * @param {boolean} isMultiSelect
     * @param {string} dir - asc, desc, none
     */
    public sortColumn(col: IVirtualGridColumn, isMultiSelect: boolean, dir?: string): void {
        // reset all columns --> there was a multisort present but now its not
        if (!isMultiSelect) {

            // find the column that has just been clicked. If the column is found, that means the user clicked the
            // same column and reverses the sort or resets it... otherwise the user clicks on another column
            // which results in a reset and a new sort with that column
            let sortedCol = this.sortedColumns.find(_col => _col.field === col.field)

            // multisort is present but this click is not with shift --> reset
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
        // let start = +new Date();
        if (this.isGridHierarchy) {
            let roots: IVirtualGridRow[] = [];

            for (let row of this.Grid.rows) {
                if (row.level == 0) {
                    roots.push(row)
                }
            }

            // let _s = +new Date();
            this.sortAsTree(roots, this.sortConfig);

            this.Grid.rows = this.Grid.Utils.flatten(roots);
            // console.log("recursive tree sort took -->", +new Date() - _s)
        } else {
            let _s = +new Date();
            this.sortHelper.multiSort(this.Grid.rows, this.sortConfig);
            console.log("sort took -->", +new Date() - _s)
        }

        this.Grid.api.refreshGrid(false, true);
        // console.log("sort finished after -->", +new Date() - start)
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
     * it sorts each subsequent childset of a row recursively
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
        for (let i = 0; i < this.colDefs.length; i++) {
            let col: IVirtualGridColumn = new VirtualGridColumn(this.Grid, this.colDefs[i], i);

            columns.push(col)
        }

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
        outer.appendChild(inner);

        document.body.appendChild(outer);
        const w1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        let w2 = inner.offsetWidth;
        if (w1 == w2) w2 = outer.clientWidth;

        document.body.removeChild(outer);

        return (w1 - w2);
    }

    /**
     * this only calculates the width of each column but does not alter the css value of the headercell
     *
     * if the columns shall be autosized we calculate the approx. width by the width of the content using the FormlayoutService
     * otherwise we divide the available width by the columns given
     */
    public calculateColumnWidth(): void {

        // let s = +new Date();
        this.calculateMinWidth();

        // the grid now has a scrollbar, so we have to create some space
        if ((this.Grid.rows.length - 1) * this.Grid.RowController.rowHeight > this.Grid.UI.domController.dom.virtualGrid.offsetHeight) {
            this.isVerticalScrolling = true;
        }

        if (this.autoSizeColumns) {
            this.autoSizeColumn();
            return
        }

        let availableWidth: number = this.Grid.UI.domController.dom.virtualGrid.clientWidth;
        let unsizedColumns: number = 0; // we count the columns without a predefined width

        if (this.isVerticalScrolling) {
            availableWidth -= this.scrollbarWidth
        }

        // first we need to find the maximum depth if the grid has tree columns
        // this is needed because the tree column will grow with each increase in depth by 16px
        // this has to be added onto the column size
        for (const col of this.Grid.originalColumns) {
            if (col.width !== void 0) {
                availableWidth -= col.width
            } else {
                unsizedColumns++;
            }
        }

        if (unsizedColumns > 0) {
            // there are columns without a defined width so we even the available space out down to the minimum of 40px
            for (let i = 0; i < this.Grid.originalColumns.length; i++) {
                let col = this.Grid.originalColumns[i];
                if (col.width === void 0) {
                    const width: number = Math.floor((availableWidth) / unsizedColumns);

                    col.width = width < this.minimumColumnWidth ? this.minimumColumnWidth : width;
                    col.width = Math.round(col.width)
                }
            }
        }
    }

    /**
     * calculates the cell content's width according toi the approximation of the text in pixel
     * using the text width inspection
     * @param col - the column
     * @param row - the row
     */
    private getCellContentWidth(col: any, row: IVirtualGridRow): number {
        let cellWidth: number = 0;

        cellWidth += row.rowData[col.field] != void 0 ? this.Grid.Utils.getTextWidthInPixel(row.rowData[col.field]) : 0;
        cellWidth += this.gPadding;

        return cellWidth;
    }

    /**
     * calculates the minimum width of a cell
     */
    private calculateMinWidth(): void {
        for (const row of this.Grid.rows) {

            for (const col of this.Grid.originalColumns) {

                if (this.truncateCellContent) {
                    col.minWidth = this.minimumColumnWidth;
                    continue;
                }

                // calculate the width of the cell to apply the minimum column width
                let cellWidth: number = 0;

                if (col.minWidth == void 0) {
                    col.minWidth = 0;
                }

                cellWidth = this.getCellContentWidth(col, row);

                if (cellWidth > col.minWidth) {
                    col.minWidth = cellWidth;
                }
            }
        }
    }

    /**
     * autosize the columns
     */
    autoSizeColumn() {
        // now we calculate the approx. width of the columns by their contents
        for (const row of this.Grid.rows) {

            for (let i = 0; i < this.Grid.originalColumns.length; i++) {
                let col = this.Grid.originalColumns[i];
                if (col.isSuppressAutoSize) {
                    continue;
                }

                if (col.width == void 0) {
                    col.width = 0;
                }

                let cellWidth: number = 0;

                cellWidth = this.getCellContentWidth(col, row);

                if (cellWidth > col.maxWidth) {
                    col.width = col.maxWidth;
                } else if (col.width < cellWidth) {
                    col.width = Math.floor(cellWidth);
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
