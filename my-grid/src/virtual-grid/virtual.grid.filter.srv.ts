import {
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridRow,
    VirtualGridCurrentFilter
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";
import {filter} from "rxjs/operators";

/**
 * instance of column controller
 * everything related to columns goes into this class
 */
export class VirtualGridFilterController {

    private filterValue = "";

    currentFilter: VirtualGridCurrentFilter = {text: "", columns: {}}

    constructor(protected Grid: IVirtualGrid, private config: VirtualGridConfigController) {
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
        this.Grid.api.refreshGrid(false, true, false);
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

            if (typeof (this.config.externalFilter) === 'function') {
                filteredArray = filteredArray.filter((row: IVirtualGridRow) => {
                    return this.config.externalFilter(row, this.filterValue);
                });
            }

            this._expandParentsAfterFilter(filteredArray, expandParents)
            this._expandChildrenAfterFilter(filteredArray)

            console.log("applying filter took --> ", +new Date() - start);

            this.Grid.ColumnController.aggregate()
        }

    }


    private _getFilteredArray = (): IVirtualGridRow[] => {

        let isMorePreciseFilter = this._isMorePreciseFilter();
        let isFilterSet = this._isFilterSet();

        // console.log("is more precise", isMorePreciseFilter)

        let filteredColIndexes = this.Grid.columns.map(x => x.isFilterPresent ? x.currentIndex : null).filter(x => x != void 0)
        let filteredArray = []
        if (isFilterSet) {

            for (let row of this.Grid.rows) {

                if (isMorePreciseFilter && !row.isVisibleAfterFilter) {
                    continue
                }

                let isColumnFilterMatching = true;
                let isGlobalFilterMatching = this.filterValue.length === 0;

                // now we apply the global filter text
                for (const col of this.Grid.columns) {

                    let isColumnFilter = filteredColIndexes.includes(col.currentIndex)
                    let isGlobalFilter = this.filterValue.length > 0

                    if (col.isSuppressFilter) {
                        continue;
                    }

                    if (!isColumnFilter && !isGlobalFilter) {
                        continue
                    }

                    let cellValue = row.getCellValue(col).toLowerCase()

                    cellValue = cellValue.replace(/  +/g, ' ')

                    if (isColumnFilter && isColumnFilterMatching) {
                        isColumnFilterMatching = this._isColumnFilterMatching(cellValue, col)
                    }

                    if (isGlobalFilter && isColumnFilterMatching && !isGlobalFilterMatching) {
                        isGlobalFilterMatching = isGlobalFilterMatching == false ? this._isGlobalFilterMatching(cellValue) : true;
                    }

                    if (!isColumnFilterMatching) {
                        break
                    }
                }

                let isMatching = isColumnFilterMatching && isGlobalFilterMatching;

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
     * pretty redundant but necessary
     * check if the filter changed at all, or the function got called by a refresh cycle
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

    private _expandParentsAfterFilter = (filteredArray: IVirtualGridRow[], expandParents: boolean): void => {
        for (const item of filteredArray) {
            let currentItem: IVirtualGridRow = item;

            currentItem.isVisible = true;
            currentItem.isVisibleAfterFilter = true;
            // adding parents to the visible rows and expanding them
            if (expandParents) {
                this.Grid.RowController.expandParents(currentItem)
            }

        }
    }

    private _expandChildrenAfterFilter = (filteredArray: IVirtualGridRow[]): void => {
        for (let item of filteredArray) {
            this._expandChildren(item.children)
        }
    }

    private _expandChildren(children) {
        if (children == void 0) {
            return
        }

        for (let child of children) {
            child.isExpanded = true;
            child.isVisible = true;
            child.isVisibleAfterFilter = true

            this._expandChildren(child.children)
        }
    }
}
