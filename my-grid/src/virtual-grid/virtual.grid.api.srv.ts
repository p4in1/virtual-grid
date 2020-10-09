/**
 * api controller
 * everything related to the api of a virtual grid instance goes here
 */
import {IRenderedRow, IVirtualGrid, IVirtualGridConfig, IVirtualGridRow} from "./interfaces/virtual.grid.interfaces";

export class VirtualGridApi {
    private debounceTimeout: any = null;
    private gPadding: number = 16;
    private useMultiSelect: boolean = false;

    scrollPosTopBackup: number = 0;

    constructor(protected Grid: IVirtualGrid, protected config: IVirtualGridConfig) {
        this.useMultiSelect = this.config.selectionMethod == "multi"
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

        if (this.Grid.UI.domController.renderedRows.length > this.Grid.UI.domController.renderedRowCount) {
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
        this.Grid.UI.domController.calculateGridHeight();

        this.Grid.RowController.calculateRowPosition(completeRefresh);

        this.Grid.RowController.toggleRenderedRowVisibility();

        this.Grid.RowController.renderRows();
        this.Grid.ColumnController.refreshColumns();

        if (this.scrollPosTopBackup > 0) {
            this.Grid.UI.domController.recalculateRowOrder(this.scrollPosTopBackup)
            this.Grid.UI.domController.dom.bodyWrapper.scrollTop = this.scrollPosTopBackup
            this.scrollPosTopBackup = 0;
        }
    }

    /**
     * updates the config properties
     * @param config
     */
    public updateConfigProperties = (config: IVirtualGridConfig): void => {
        this.useMultiSelect = config.selectionMethod === "multi";
    };
    /**
     * Updates the rows in the grid and refreshes the grid
     *
     * @param {Array} rows
     * @param {boolean} resetRowConfig
     */
    public updateGridRows = (rows: any[], resetRowConfig: boolean): void => {
        // resetting and setting general properties
        this.Grid.updateConfigProperties();

        this.scrollPosTopBackup = this.Grid.UI.domController.dom.bodyWrapper.scrollTop

        if (resetRowConfig) {
            this.Grid.UI.domController.resetRenderedRows();
        }

        this.Grid.rows = this.Grid.RowController.createRowModels(rows);
        // processing row data and convert into a more suitable structure
        this.Grid.RowController.buildRows();

        this.Grid.FilterController.resetFilter()
        // refreshing the visual projection
        this.Grid.api.refreshGrid(true, true);


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

        for (let col of config.sort) {
            this.Grid.ColumnController.sortColumn(columns[col.index], config.sort.length > 1, col.dir)
        }

        this.refreshGrid(true, true)

        if (config.scrollTop !== 0) {
            this.Grid.UI.domController.dom.bodyWrapper.scrollTop = config.scrollTop
        }
    }

    getConfig = (): any => {
        let scrollTop = this.Grid.UI.domController.dom.bodyWrapper.scrollTop;
        let columns = this.Grid.originalColumns.sort((a, b) => {
            return a.index - b.index
        })

        let colWidths = columns.map((col) => {
            return {"index": col.index, "width": col.width}
        })

        let sort = this.Grid.ColumnController.sortedColumns.map((col) => {
            return {"index": col.index, "dir": col.sortDirection}
        })

        let filter = {
            global: this.Grid.FilterController.currentFilter.text,
            columns: []
        }

        for (let index in this.Grid.FilterController.currentFilter.columns) {
            let col = this.Grid.FilterController.currentFilter.columns[index]
            if (col.value !== "" || col.content.length > 0) {
                filter.columns.push({index, filterValue: col.value, content: col.content})
            }
        }

        return {scrollTop, colWidths, sort, filter}
    }

    /**
     * returns all rows
     * @returns {Array}
     */
    public getRows = (): any[] => {
        return this.Grid == void 0 ? [] : this.Grid.rows;
    };
    /**
     * return the row where key and value are matching
     *
     * @param {string} key   - the key to use
     * @param {string} value - the value to find
     * @param {boolean} useRowData - searches the given key/value pair inside the original data
     * @returns {VirtualGridRow|null}
     */
    public getRowByKey = (key: string, value: string | number, useRowData: boolean = false): IVirtualGridRow => {

        if (this.Grid == void 0) {
            return;
        }

        for (const i in this.Grid.rows) {

            let searchObject = useRowData ? this.Grid.rows[i].rowData : this.Grid.rows[i];
            if (searchObject[key] == value) {
                return this.Grid.rows[i];
            }
        }

        return null;
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
     * return all visible rows
     * @returns {Array}
     */
    public getVisibleRows = (): IVirtualGridRow[] => {
        const rows: any[] = [];

        for (const i in this.Grid.rows) {
            if (this.Grid.rows[i].isVisible && this.Grid.rows[i].isVisibleAfterFilter) {
                rows.push(this.Grid.rows[i]);
            }
        }

        return rows;
    };

    /**
     * return the selected rows
     * @returns {Array}
     */
    public getSelectedRows = (): IVirtualGridRow[] => {
        return this.Grid == void 0 ? [] : this.Grid.RowController.selectedRows;
    };

    /**
     * return the row count
     * @returns {number}
     */
    public getRowCount = (): number => {
        return this.Grid == void 0 ? 0 : this.Grid.rows.length;
    };

    /**
     * select one or multiple rows according to ctrl and shift key
     *
     * @param row - the clicked row
     * @param {boolean} useCtrl - boolean if the ctrl key is used
     * @param {boolean} useShift - boolean if the shift key is used
     * @param {boolean} isCheckboxSelect - boolean - true if checkbox was clicked (only tablet)
     */
    public select = (row: IVirtualGridRow, useCtrl: boolean = false, useShift: boolean = false, isCheckboxSelect: boolean = false): void => {
        // the row is already selected
        if (row.isSelected) {
            if (!useCtrl && !useShift && !isCheckboxSelect) {
                this.deselectAll();
                this.selectRow(row);
            } else if (useCtrl || isCheckboxSelect && !useShift) {
                this.deselectRow(row);
            }

            return;
        }

        // in this case we deselect all other selected rows
        if (((!useCtrl && !useShift) || !this.useMultiSelect) && !isCheckboxSelect) {
            this.deselectAll();
        }

        if (useShift) {
            if (this.Grid.RowController.selectedRows.length > 0) {
                const lastSelectedIndex: number = this.Grid.RowController.selectedRows[this.Grid.RowController.selectedRows.length - 1].index;
                const currentIndex: number = row.index;

                const min: number = Math.min(lastSelectedIndex, currentIndex);
                const max: number = Math.max(lastSelectedIndex, currentIndex);

                for (let i: number = min; i <= max; i++) {
                    if (this.Grid.rows[i].isSelectable && !this.Grid.rows[i].isSelected) {
                        this.selectRow(this.Grid.rows[i]);
                    }
                }
            } else {
                this.selectRow(row);
            }
        } else {
            this.selectRow(row);
        }

        this.Grid.RowController.renderRows();
    };

    /**
     * select the row with the given index
     * @param {string} index - the index of the row to select
     */
    public selectIndex = (index: number): void => {
        const row: IVirtualGridRow | null = this.getRowByIndex(index);
        if (row != void 0) {
            this.select(row);
        }
    };

    /**
     * select the given values if possible
     * scroll to the first selected row
     * render the nodes
     *
     * @param values - the values to select
     * @param selectCaseInsensitive - boolean whether to select case insensitive or not
     */
    public selectValues = (values: any, selectCaseInsensitive: boolean = false): void => {

        if (values == void 0 || values == '') {
            return;
        }

        if (!Array.isArray(values)) {
            values = [values];
        }

        if (!this.useMultiSelect) {
            values = [values[0]];
        }

        const valueList: string[] = [];
        for (const i in values) {
            const value: string = selectCaseInsensitive ? values[i].toLowerCase() : values[i];
            valueList.push(value);
        }

        for (const row of this.Grid.rows) {

            for (const col of this.Grid.originalColumns) {

                let cellValue: string = row.rowData[col.field];

                if (cellValue == void 0) {
                    continue;
                }

                cellValue = selectCaseInsensitive ? cellValue.toLowerCase() : cellValue;

                if (valueList.indexOf(cellValue) != -1) {
                    this.selectRow(row);
                    break;
                }
            }
        }

        if (this.Grid.RowController.selectedRows[0] != void 0) {
            this.scrollToIndex(this.Grid.RowController.selectedRows[0].index);
        }

        this.Grid.RowController.renderRows();
    };

    /**
     * select the given values by the given paths (the path is parent/child related)
     * scroll to the first selected row
     * render the nodes
     *
     * @param valuePaths - the given paths to the values
     * @param selectCaseInsensitive - boolean whether to select case insensitive or not
     */
    public selectValuesByPaths = (valuePaths: string[], selectCaseInsensitive: boolean = false): void => {

        for (const path of valuePaths) {
            const pathString: string = path[path.length - 1];
            const elementToFind: string = selectCaseInsensitive ? pathString.toLowerCase() : pathString;

            for (const row of this.Grid.rows) {

                for (const col of this.Grid.originalColumns) {
                    let cellValue: any = row.rowData[col.field];

                    if (cellValue == void 0) {
                        continue;
                    }

                    cellValue = selectCaseInsensitive ? cellValue.toLowerCase() : cellValue;
                    if (cellValue == elementToFind) {
                        const currentPath: string[] = [];
                        currentPath.push(elementToFind);

                        let currentItem: IVirtualGridRow = row;
                        let hasParent: boolean = currentItem.parent != void 0;

                        while (hasParent) {
                            currentItem = currentItem.parent;

                            currentPath.unshift(currentItem.rowData[col.field]);

                            if (currentItem.parent == void 0) {
                                hasParent = false;
                            }
                        }

                        if (path.toString().toLowerCase() === currentPath.toString().toLowerCase()) {
                            this.selectRow(row);
                            break;
                        }
                    }
                }
            }
        }

        if (this.Grid.RowController.selectedRows[0] != void 0) {
            this.scrollToIndex(this.Grid.RowController.selectedRows[0].index);
        }

        this.Grid.RowController.renderRows();
    };

    /**
     * deselect all rows
     */
    public deselectAll = (): void => {

        for (const renderedRow of this.Grid.UI.domController.renderedRows) {

            [renderedRow.left, renderedRow.center, renderedRow.right].forEach((rowPartial) => {
                rowPartial.element.classList.remove('selected');
            })

        }

        for (const i in this.Grid.rows) {
            this.Grid.rows[i].isSelected = false;
        }

        this.Grid.RowController.selectedRows = [];
    };

    /**
     * scroll to a specific node by index
     * the node should be visible in the center of the grid if possible
     * @param {Number} index - The Index we have to scroll to
     * @param {Boolean} scrollHorizontal - Whether to scroll horizontally or not
     */
    public scrollToIndex = (index: number, scrollHorizontal: boolean = true): void => {
        let dom = this.Grid.UI.domController.dom
        let visibleItemsBefore: number = 0;

        for (const row of this.Grid.rows) {

            if (row.index == index) {
                break;
            }

            if (row.isVisible && row.isVisibleAfterFilter) {
                visibleItemsBefore++;
            }
        }

        const scrollLeftPosition: number = this.Grid.rows[index].level * this.gPadding;
        const scrollTopPosition: number = (visibleItemsBefore * this.Grid.RowController.rowHeight) - (dom.virtualGrid.offsetHeight / 2);

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
        this.Grid.UI.destroy();
    };

    public setGridContent() {
        // let start = +new Date();

        this.Grid.updateConfigProperties();
        // console.log("--> update properties -->", +new Date() - start);
        // start = +new Date();

        this.Grid.UI.domController.resetRenderedRows();
        // console.log("--> reset rows -->", +new Date() - start);
        // start = +new Date();

        // processing row data and convert into a more suitable structure
        this.Grid.RowController.buildRows();
        // console.log("--> build rows -->", +new Date() - start);

        // refreshing the visual projection
        this.refreshGrid(true);
    }

    /**
     * deselect a single row
     * @param row
     */
    public deselectRow(row: any): void {

        row.isSelected = false;

        for (const i in this.Grid.RowController.selectedRows) {
            if (this.Grid.RowController.selectedRows[i].index == row.index) {
                this.Grid.RowController.selectedRows.splice(Number(i), 1);
                break;
            }
        }

        for (const renderedRow of this.Grid.UI.domController.renderedRows) {
            if (renderedRow.index == row.index) {

                [renderedRow.left, renderedRow.center, renderedRow.right].forEach((rowPartial) => {
                    rowPartial.element.classList.remove('selected');
                })

                break;
            }
        }
    }

    /**
     * select a single row
     * @param row
     */
    public selectRow(row: IVirtualGridRow): void {

        if (!row.isSelectable) {
            return;
        }

        row.isSelected = true;

        this.Grid.RowController.selectedRows.push(row);

        for (const renderedRow of this.Grid.UI.domController.renderedRows) {

            if (renderedRow.index == row.index) {
                this.toggleSelectionClasses(renderedRow);
            }
        }
    }

    /**
     * Alter the selection class of the row
     * @param row
     */
    private toggleSelectionClasses(row: IRenderedRow): void {

        [row.left, row.center, row.right].forEach((rowPartial) => {

            if (this.Grid.rows[row.index].isSelected) {
                rowPartial.element.classList.add('selected');
            } else {
                rowPartial.element.classList.remove('selected');
            }

            if (!this.Grid.rows[row.index].isSelectable) {
                rowPartial.element.classList.add('not-selectable');
                rowPartial.element.classList.remove('selectable');
            } else {
                rowPartial.element.classList.add('selectable');
                rowPartial.element.classList.remove('not-selectable');
            }
        })
    }


}
