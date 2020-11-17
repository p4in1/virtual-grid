import {
    IValueFormatterParams,
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

    aggregate() {
        let s = +new Date()

        for (let col of this.Grid.columns) {
            if (col.aggFunc) {

                let values = []

                for (let row of this.Grid.rows) {
                    if (!row.isRowGroup) {
                        values.push(row.getCellValue(col, {stringify: false, format: false}))
                    }
                }

                let func: Function = this.getAggFunction(col)
                if (func) {
                    let value = func(values)

                    if (typeof col.cellValueFormatter == "function") {
                        value = col.cellValueFormatter({colModel: col, rowModel: null, isAggregate: true}, value)
                    } else if (col.colType === "number" && !this.Grid.Utils.isInteger(value)) {
                        value = Number(value).toFixed(2)
                    }

                    col.dom.cellAggregationValue.textContent = value
                }
            }
        }

        console.log("aggregating values took -->", +new Date() - s)
    }

    getAggFunction(col) {
        if (typeof col.aggFunc === "function") {
            return col.aggFunc
        }

        switch (col.aggFunc) {
            case "min":
                return this.getMinValue
            case "max":
                return this.getMaxValue
            case "avg":
                return this.getAverageValue
            case "sum":
                return this.getTotalValue
        }
    }

    getMinValue = (values) => {
        return Math.min(...values)
    }

    getMaxValue = (values) => {
        return Math.max(...values)
    }

    getAverageValue = (values) => {
        return this.getTotalValue(values) / values.length
    }

    getTotalValue = (values) => {
        return values.reduce(function (a, b) {
            return a + b;
        }, 0);
    }
}
