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
    public scrollbarWidth: number = this.Grid.domController.getScrollbarWidth();

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
     * creates column models ... *duh*
     */
    public createColumnModels() {

        let columns: IVirtualGridColumn[] = [];

        this.config.colDefs.forEach((col, index) => {
            columns.push(new VirtualGridColumn(this.Grid, col, index))
        })

        return columns
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
}
