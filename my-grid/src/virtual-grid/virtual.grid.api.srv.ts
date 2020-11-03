/**
 * api controller
 * everything related to the api of a virtual grid instance goes here
 */
import {IVirtualGrid, IVirtualGridRow} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";

export class VirtualGridApi {
    private debounceTimeout: any = null;

    scrollPosTopBackup: number = 0;

    constructor(protected Grid: IVirtualGrid, private config: VirtualGridConfigController) {
    }

    /**
     * refresh the grid and redraw the nodes
     * debounce the refresh in case multiple updates would be made in a short period of time like deleting rows
     *
     * @param {boolean} immediate - refreshes the grid immediate or after a timeout
     * @param {boolean} completeRefresh - boolean to start refreshing at the top
     */
    public refreshGrid = (immediate: boolean = false, completeRefresh: boolean = false): void => {
        if (this.Grid == void 0) {
            return;
        }

        if (this.Grid.domController.renderedRows.length > this.Grid.domController.renderedRowCount) {
            console.error('Rendered row count exceeded the configured maximum!!!');
        }

        clearTimeout(this.debounceTimeout);

        if (immediate) {
            this._refresh(completeRefresh);
        } else {
            this.debounceTimeout = setTimeout(() => {
                this._refresh(completeRefresh)
            }, 50);
        }
    };

    /**
     * refreshes the grid and redraws rows
     */
    private _refresh(completeRefresh: boolean): void {
        if (this.Grid === void 0) {
            return;
        }

        this.Grid.FilterController.applyFilter()

        this.Grid.RowController.rebuildVisibleRowMap();
        this.Grid.domController.calculateGridHeight();

        this.Grid.RowController.calculateRowPosition(completeRefresh);

        if (completeRefresh) {
            this.Grid.SelectionController.clearRangeSelection()
        }

        this.Grid.RowController.toggleRenderedRowVisibility();

        this.Grid.RowController.renderRows();
        this.Grid.ColumnController.refreshColumns();

        if (this.scrollPosTopBackup > 0) {
            this.Grid.domController.recalculateRowOrder(this.scrollPosTopBackup)
            this.Grid.domController.dom.bodyWrapper.scrollTop = this.scrollPosTopBackup
            this.scrollPosTopBackup = 0;
        }
    }

    /**
     * Updates the rows in the grid and refreshes the grid
     *
     * @param {Array} rows
     * @param {boolean} resetRowConfig
     * @param {boolean} isRowGrouping
     */
    public updateGridRows = (rows: any[], resetRowConfig?: boolean, isRowGrouping?): void => {
        if (!isRowGrouping) {
            this.Grid.ConfigController.originalRows = rows
        }

        this.scrollPosTopBackup = this.Grid.domController.dom.bodyWrapper.scrollTop

        if (resetRowConfig) {
            this.Grid.domController.resetRenderedRows();
        }

        this.Grid.rows = this.Grid.RowController.createRowModels(rows);
        // processing row data and convert into a more suitable structure
        this.Grid.RowController.buildRows();

        this.Grid.FilterController.resetFilter()
        // refreshing the visual projection
        this.Grid.api.refreshGrid(false, true)
        // this.Grid.SortController.applySorting();
    };

    setConfig = (config): void => {

        let columns = this.Grid.originalColumns.sort((a, b) => {
            return a.index - b.index
        })

        this.Grid.FilterController.currentFilter.text = config.filter.global

        for (let col of config.filter.columns) {
            let currentColumn = columns[col.index];

            currentColumn.colType === "boolean" && this.Grid.FilterController.setBoolFilter(currentColumn, col.filterValue)
            currentColumn.colType !== "boolean" && this.Grid.FilterController.setTextFilter(currentColumn, col.filterValue, col.content)
        }

        for (let col of config.colWidths) {
            let column = columns.find(x => x.field == col.field)
            column.api.setWidth(col.width)
        }

        if (config.groups != void 0) {
            this.Grid.DnDController.clearGrouping()

            for (let col of config.groups) {
                let column = columns.find(x => x.field == col.field)
                this.Grid.DnDController._addGroup(column, true)
            }

            this.Grid.DnDController.applyGrouping()
        }

        if (config && config.sort && Array.isArray(config.sort)) {
            for (let col of config.sort) {
                let column = columns.find(x => x.field == col.field)
                this.Grid.SortController.sortColumn(column, config.sort.length > 1, col.dir)
            }
        } else {
            this.refreshGrid(true, true)
        }

        if (config.scrollTop !== 0) {
            this.Grid.domController.dom.bodyWrapper.scrollTop = config.scrollTop
        }
    }

    getConfig = (): any => {
        let scrollTop = this.Grid.domController.dom.bodyWrapper.scrollTop;
        let columns = this.Grid.originalColumns.sort((a, b) => {
            return a.index - b.index
        })

        let colWidths = columns.map((col) => {
            return {"field": col.field, "width": col.width}
        })

        let sort
        // let sort = this.Grid.SortController.sortedColumns.map((col) => {
        //     return {"field": col.field, "dir": col.sortDirection}
        // })

        let filter = {
            global: this.Grid.FilterController.currentFilter.text,
            columns: []
        }

        let groups = this.Grid.DnDController.groups.map((group) => {
            return {field: group.col.field}
        })

        for (let index in this.Grid.FilterController.currentFilter.columns) {
            let col = this.Grid.FilterController.currentFilter.columns[index]
            if (col.value !== "" || col.content.length > 0) {
                filter.columns.push({index, filterValue: col.value, content: col.content})
            }
        }

        return {scrollTop, colWidths, sort, filter, groups}
    }

    /**
     * returns all rows
     * @returns {Array}
     */
    public getRows = (): any[] => {
        return this.Grid == void 0 ? [] : this.Grid.rows;
    };

    /**
     * return the row with the given index
     *
     * @param {string} index   - the index of the row
     * @returns {VirtualGridRow|null}
     */
    public getRowByIndex = (index: number): IVirtualGridRow => {

        if (this.Grid == void 0) {
            return;
        }

        for (const row of this.Grid.rows) {
            if (row.index == index) {
                return row
            }
        }

        return null;
    };

    /**
     * return the selected rows
     * @returns {Array}
     */
    public getSelectedRows = (): any => {
        return this.Grid == void 0 ? [] : this.Grid.SelectionController.getSelection()
    };

    /**
     * return the row count
     * @returns {number}
     */
    public getRowCount = (): number => {
        return this.Grid == void 0 ? 0 : this.Grid.rows.length;
    };

    /**
     * scroll to a specific node by index
     * the node should be visible in the center of the grid if possible
     * @param {Number} index - The Index we have to scroll to
     * @param {Boolean} scrollHorizontal - Whether to scroll horizontally or not
     */
    public scrollToIndex = (index: number, scrollHorizontal: boolean = true): void => {
        let dom = this.Grid.domController.dom
        let visibleItemsBefore: number = 0;

        for (const row of this.Grid.rows) {

            if (row.index == index) {
                break;
            }

            if (row.isVisible && row.isVisibleAfterFilter) {
                visibleItemsBefore++;
            }
        }

        const scrollLeftPosition: number = this.Grid.rows[index].level * 16; // padding
        const scrollTopPosition: number = (visibleItemsBefore * this.config.rowHeight) - (dom.virtualGrid.offsetHeight / 2);

        dom.bodyWrapper.scrollTop = scrollTopPosition;

        if (scrollHorizontal && scrollLeftPosition > (dom.virtualGrid.offsetWidth / 2)) {
            dom.bodyWrapper.scrollLeft = scrollLeftPosition / 2;
        }
    };

    /**
     * filter all grid elements based on the given string and set each row visible or not
     * @param value - the value to search for (we only allow values that begin with the given value)
     * @param expandParents
     */
    public setFilter = (value?: string, expandParents: boolean = true): void => {
        this.Grid.FilterController.setFilter(value, expandParents)
    };

    /**
     * Remove a row by the given key value pair
     * @param key - the key to look for
     * @param value - the value to match
     */
    public removeRowByKey = (key: string, value: string): void => {

        for (const row of this.Grid.rows) {

            if (row[key] == value) {
                this.removeRow(row);
                this.deselectRow(row);
                break;
            }
        }
    };

    /**
     * remove multiple rows
     * @param rows - an array of rows
     */
    public removeRows = (rows: IVirtualGridRow[]): void => {
        rows.forEach(this.removeRow);
    };

    /**
     * remove a single row
     * @param row - the row to delete
     */
    public removeRow = (row: IVirtualGridRow): void => {
        // instead of just removing the nodes, we detach them and won't reattach them :P
        this.Grid.RowController.detachRowByIndex(row.index);
        this.Grid.RowController.setRowIndexes();

        if (row.parent != void 0) {
            row.parent.childCountTotal = this.Grid.RowController.getCompleteChildCount(row.parent);
        }

        this.refreshGrid();
    };

    /**
     * convenience api function
     * implementation see RowController.moveRow
     *
     * @param {number} rowIndexToMove
     * @param {number} rowIndexToAppend
     * @param {boolean} appendAsChild
     */
    public moveRow = (rowIndexToMove: number, rowIndexToAppend: number, appendAsChild: boolean): void => {
        this.Grid.RowController.moveRow(rowIndexToMove, rowIndexToAppend, appendAsChild);
    };

    /**
     * convenience api function
     * implementation see RowController.insertRows
     *
     * @param {number} rowIndexToInsert
     * @param {Array} rowsToInsert
     * @param {boolean} insertAsChildren
     */
    public insertRows = (rowIndexToInsert: number, rowsToInsert: any[], insertAsChildren: boolean): void => {
        this.Grid.RowController.insertRows(rowIndexToInsert, rowsToInsert, insertAsChildren);
    };

    /**
     * expand or collapse a row
     * @param row - the row to open or close
     * @param expand - whether the row shall be expand or collapsed
     */
    public toggleRow = (row: IVirtualGridRow, expand: boolean): void => {
        this.Grid.RowController.toggleRow(row, expand);
    };

    /**
     * refreshes the column headers and executes the headerValueGetter
     */
    public refreshHeader = (): void => {
        this.Grid.ColumnController.refreshColumns();
    };

    /**
     * destroys the whole grid and releases event listeners and removes all dom nodes
     */
    public destroy = (): void => {
        this.Grid.rows = [];

        this.Grid.ColumnController.destroy();
    };

    public setGridContent() {
        this.Grid.domController.resetRenderedRows();
        this.Grid.RowController.buildRows();

        this.refreshGrid(true);
    }

    /**
     * select one or multiple rows according to ctrl and shift key
     *
     * @param row - the clicked row
     * @param {boolean} useCtrl - boolean if the ctrl key is used
     * @param {boolean} useShift - boolean if the shift key is used
     */
    public select = (row: IVirtualGridRow, useCtrl: boolean = false, useShift: boolean = false): void => {
        this.Grid.SelectionController.select(row, useCtrl, useShift)
    };

    /**
     * deselect a single row
     * @param row
     */
    public deselectRow(row: IVirtualGridRow): void {
        this.Grid.SelectionController.deselectRow(row)
    }

    /**
     * deselect all rows
     */
    deselectAll = (): void => {
        this.Grid.SelectionController.deselectAll()
    };

    /**
     * select a single row
     * @param row
     */
    public selectRow(row: IVirtualGridRow): void {
        this.Grid.SelectionController.selectRow(row)
    }
}
