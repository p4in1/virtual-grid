import {
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridRow,
    VirtualGridCurrentFilter
} from "./interfaces/virtual.grid.interfaces";

/**
 * instance of column controller
 * everything related to columns goes into this class
 */
export class VirtualGridFilterController {

    private externalFilter: any;
    private filterValue = "";

    currentFilter: VirtualGridCurrentFilter = {text: "", columns: {}}

    constructor(protected Grid: IVirtualGrid, private config: any) {
        this.externalFilter = this.config.externalFilter;

        this.resetFilter()
    }

    resetFilter() {
        for (let column of this.Grid.originalColumns) {
            this.currentFilter.columns[column.index] = {
                value: "",
                content: []
            }
        }
    }

    setTextFilter = (col: IVirtualGridColumn, value: string, content?: string[]): void => {
        col.filter.value = value
        col.filter.content = content == void 0 ? col.filter.content : content
        col.isFilterPresent = col.filter.value.length > 0 || col.filter.content.length > 0

        if (col.dom.cellFilter.value != value) {
            col.dom.cellFilter.value = value
        }

        this.Grid.api.setFilter()
    }

    setBoolFilter = (col: IVirtualGridColumn, value: boolean): void => {
        let currentValue = col.filter.value
        let filter = value === true ? col.dom.cellTrueFilter : col.dom.cellFalseFilter
        let otherFilter = value === true ? col.dom.cellFalseFilter : col.dom.cellTrueFilter

        col.filter.value = currentValue === value ? "" : value;
        col.isFilterPresent = col.filter.value !== "" || col.filter.content.length > 0

        filter.classList.add("active")
        otherFilter.classList.remove("active")

        if (col.filter.value === "") {
            filter.classList.remove("active")
        }

        this.Grid.api.setFilter()
    }

    /**
     * filter all grid elements based on the given string and set each row visible or not
     * @param value - the value to search for (we only allow values that begin with the given value)
     * @param expandParents
     */
    public setFilter = (value?: string, expandParents: boolean = true): void => {

        if (value != void 0) {
            this.filterValue = value
        }

        this.applyFilter(expandParents)
        this.Grid.api.refreshGrid(false, true);
    };

    applyFilter(expandParents: boolean = true) {
        let start = +new Date();

        if (this._isFilterChanged()) {
            let filteredArray: IVirtualGridRow[] = this._getFilteredArray();

            console.log("filter took --> ", +new Date() - start, "filtered count --> ", filteredArray.length);

            this.currentFilter.text = this.filterValue

            for (let col of this.Grid.originalColumns) {
                this.currentFilter.columns[col.index].value = col.filter.value
                this.currentFilter.columns[col.index].content = col.filter.content
            }

            if (typeof (this.externalFilter) === 'function') {
                filteredArray = filteredArray.filter((row: IVirtualGridRow) => {
                    return this.externalFilter(row, this.filterValue);
                });
            }

            this._expandParentsAfterFilter(filteredArray, expandParents)
        }
        // console.log("applying filter took --> ", +new Date() - start);
    }


    private _getFilteredArray = (): IVirtualGridRow[] => {

        let isMorePreciseFilter = this._isMorePreciseFilter();
        let isFilterSet = this._isFilterSet();

        console.log("is more precise", isMorePreciseFilter)

        let filteredColIndexes = this.Grid.columns.map(x => x.isFilterPresent ? x.currentIndex : null).filter(x => x)
        let filteredArray = []
        if (isFilterSet) {

            for (let row of this.Grid.rows) {

                if (isMorePreciseFilter && !row.isVisibleAfterFilter) {
                    continue
                }

                let isMatching = true;

                // now we apply the global filter text
                for (const col of this.Grid.columns) {

                    let isColumnFilter = filteredColIndexes.includes(col.currentIndex)
                    let isGlobalFilter = this.filterValue.length > 0

                    if (col.isSuppressFilter) {
                        continue;
                    }

                    if (!isColumnFilter && !isColumnFilter) {
                        continue
                    }

                    let cellValue = this._getCellValue(row, col).toLowerCase()

                    if (isColumnFilter && isMatching) {
                        isMatching = this._isColumnFilterMatching(cellValue, col)
                    }

                    if (isGlobalFilter && isMatching) {
                        isMatching = this._isGlobalFilterMatching(cellValue)
                    }

                    if (!isMatching) {
                        break
                    }
                }

                row.isVisible = isMatching;
                row.isVisibleAfterFilter = isMatching;

                if (isMatching) {
                    filteredArray.push(row)
                }
            }

            return filteredArray
        } else {
            return this.Grid.rows;
        }
    }

    private _isColumnFilterMatching = (cellValue, col): boolean => {
        let isMatching = true
        let boolValue = cellValue === "false" ? false : cellValue === "true" ? true : !!cellValue
        let value = col.filter.value

        if (col.colType === "boolean") {
            return value === boolValue
        }

        if (cellValue.indexOf(value.toString().toLowerCase()) === -1) {
            isMatching = false
        }

        return isMatching
    }

    private _isGlobalFilterMatching = (cellValue): boolean => {
        return cellValue.indexOf(this.filterValue.toLowerCase()) !== -1
    }

    /**
     * we determine whether the given filter is more precise than before
     * this will impact the filters performance
     *
     * e.g.
     * assume the filter's value is "tes".
     * elements that do not match this filter will not be shown
     * assume the user enters another letter resulting in the filter's value "test"
     * each element that did not match before won't do it now and therefore
     * we do not need to check the already filtered elements that did not match before
     */
    private _isMorePreciseFilter = (): boolean => {

        if (this.filterValue.length > this.currentFilter.text.length) {
            return true
        }

        for (let col of this.Grid.originalColumns) {
            let colFilter = col.filter.value.toString()
            let currentFilter = this.currentFilter.columns[col.index]
            let currentValue = currentFilter.value.toString()

            if (col.colType === "boolean" && colFilter != currentValue) {
                return currentValue === "";
            }

            if (colFilter.length > currentValue.length) {
                return true
            }

            if (col.filter.content.length > currentFilter.content.length) {
                return true
            }
        }

        return false
    }

    /**
     * pretty redundand but necessary
     * check if the filter cahnged at all, or the function got called by a refresh cycle
     */
    private _isFilterChanged() {
        if (this.filterValue.length !== this.currentFilter.text.length) {
            return true
        }

        for (let col of this.Grid.originalColumns) {
            if (col.filter.value !== this.currentFilter.columns[col.index].value) {
                return true
            }

            if (col.filter.content.length !== this.currentFilter.columns[col.index].content.length) {
                return true
            }
        }

        return false
    }

    /**
     * determines whether the filter is set or not
     * if not, we restore all elements of the grid
     */
    private _isFilterSet = (): boolean => {

        if (this.filterValue != "") {
            return true
        }

        for (let col of this.Grid.originalColumns) {
            if (col.isFilterPresent) {
                return true
            }
        }

        return false
    }

    /**
     * returns the cell value of a given row and column
     *
     * filter priorization
     * 1. cellRenderer              -> this might not have the highest value, but if there is a cellRenderer, the content of the cell is all we have
     * 2. cellValueGetter           -> this should return the value of the cell
     * 3. data type as Array        -> there is a special need in case the cellContent is an array .. we have to join the array
     * 4. data type of the column   -> this is the lowest prio but the highest probability and we interprete the datatype which should not be problematic
     *
     * @param row
     * @param col
     */
    private _getCellValue = (row: IVirtualGridRow, col: IVirtualGridColumn): string => {
        let cellData: any = this.Grid.RowController.getCellData(row.rowData, col.fieldPath);
        let cellValue: string;
        let cell: any = {
            rowModel: this.Grid.rows[row.index],
            colModel: this.Grid.originalColumns[col.index]
        };

        if (typeof cell.colModel.cellRenderer === "function") {
            cellValue = cell.colModel.cellRenderer(cell)
        } else if (typeof cell.colModel.cellValueGetter === "function") {
            cellValue = cell.colModel.cellValueGetter(cell, cellData)
        } else {
            if (col.colType == "multiLine") {
                cellValue = cellData.join(" ")
            } else if (col.colType == "date") {
                cellValue = this.Grid.Utils.parseDate(cellData)
            } else {
                cellValue = cellData
            }
        }

        return cellValue.toString();
    }

    private _expandParentsAfterFilter = (filteredArray: IVirtualGridRow[], expandParents: boolean): void => {
        for (const item of filteredArray) {
            let currentItem: IVirtualGridRow = item;
            let hasParent: boolean = currentItem.parent != void 0;
            let addedParentCount: number = 0;
            currentItem.isVisible = true;
            currentItem.isVisibleAfterFilter = true;
            // adding parents to the visible rows and expanding them
            while (hasParent) {
                currentItem = currentItem.parent;
                if (expandParents) {

                    currentItem.isExpanded = true;
                    currentItem.isVisible = true;
                    currentItem.isVisibleAfterFilter = true
                }

                addedParentCount++;
                if (currentItem.parent == void 0) {
                    hasParent = false;
                }
            }
        }
    }
}