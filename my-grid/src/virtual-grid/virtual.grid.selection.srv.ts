import {
    IRenderedCell,
    IVirtualGrid,
    IVirtualGridRow,
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";

interface IVirtualRangeSelection {
    start: any
    end: any
    rows: any
    id: string
}

export class VirtualGridSelectionController {

    selectedRows: IVirtualGridRow[] = []

    isRangeSelectActive: boolean = false
    currentRangeSelection: IVirtualRangeSelection;
    rangeSelection: IVirtualRangeSelection[] = []

    constructor(private Grid: IVirtualGrid, private config: VirtualGridConfigController) {

    }

    getRangeSelection() {
        return this.rangeSelection
    }

    getSelectedRows(): IVirtualGridRow[] {
        return this.selectedRows
    }

    /**
     * select one or multiple rows according to ctrl and shift key
     *
     * @param row - the clicked row
     * @param {boolean} useCtrl - boolean if the ctrl key is used
     * @param {boolean} useShift - boolean if the shift key is used
     */
    public select = (row: IVirtualGridRow, useCtrl: boolean = false, useShift: boolean = false): void => {
        // the row is already selected
        if (row.isSelected) {
            if (!useCtrl && !useShift) {
                this.deselectAll();
                this.selectRow(row);
            } else if (useCtrl && !useShift) {
                this.deselectRow(row);
                this.Grid.RowController.renderRows();
            }

            return;
        }

        // in this case we deselect all other selected rows
        if ((!useCtrl && !useShift) || !this.config.isMultiSelect) {
            this.deselectAll();
        }

        if (useShift) {
            if (this.selectedRows.length > 0) {
                const lastSelectedIndex: number = this.selectedRows[this.selectedRows.length - 1].index;
                const currentIndex: number = row.index;

                const min: number = Math.min(lastSelectedIndex, currentIndex);
                const max: number = Math.max(lastSelectedIndex, currentIndex);

                for (let i: number = min; i <= max; i++) {
                    let row = this.Grid.rows[i]
                    if (row.isSelectable && !row.isSelected) {
                        this.selectRow(row);
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
     * deselect a single row
     * @param row
     */
    public deselectRow(row: IVirtualGridRow): void {

        row.isSelected = false;

        for (const i in this.selectedRows) {
            if (this.selectedRows[i].index == row.index) {
                this.selectedRows.splice(Number(i), 1);
                break;
            }
        }

        this.Grid.RowController.toggleSelectionClasses(row, false);
    }

    /**
     * deselect all rows
     */
    public deselectAll = (): void => {

        for (let row of this.selectedRows) {
            this.Grid.RowController.toggleSelectionClasses(row, false);
        }

        for (const row of this.Grid.rows) {
            row.isSelected = false;
        }

        this.selectedRows = [];
    };

    /**
     * select a single row
     * @param row
     */
    public selectRow(row: IVirtualGridRow): void {

        if (!row.isSelectable) {
            return;
        }

        row.isSelected = true;

        this.selectedRows.push(row);
        this.Grid.RowController.toggleSelectionClasses(row);
    }

    onCellMouseDown = (event: any, cell: IRenderedCell): void => {

        if (!this.Grid.ConfigController.isRangeSelect) {
            return
        }

        if (event.buttons != 1) {
            let currentCol = cell.colModel.currentIndex
            let currentRow = cell.rowModel.index

            for (let range of this.rangeSelection) {
                let minMax = this._getMinMax(range)
                if (currentCol >= minMax.minCol && currentCol <= minMax.maxCol && currentRow >= minMax.minRow && currentRow <= minMax.maxRow) {
                    return;
                }
            }
        }

        if (!event.ctrlKey) {
            this.clearRangeSelection()
        }

        this.isRangeSelectActive = true

        let range: IVirtualRangeSelection = {
            start: {},
            end: {},
            rows: [],
            id: this.Grid.Utils.generateUUID()
        }

        range.start.row = cell.rowModel
        range.start.col = cell.colModel
        range.rows = []

        this.currentRangeSelection = range
        this.rangeSelection.push(range)

        const _unbind = (): void => {

            this.isRangeSelectActive = false;

            window.removeEventListener("mouseup", _unbind)
        }

        window.addEventListener("mouseup", _unbind);
    }

    public clearRangeSelection = (): void => {

        for (let range of this.rangeSelection) {
            this._clearRange(range)
        }

        this.rangeSelection = []
    }

    private _clearRange(range) {
        for (let selectedRow of range.rows) {
            for (let cell of selectedRow) {
                cell.cellNode.classList.remove("selected", "range-border-top", "range-border-bottom", "range-border-right", "range-border-left")

                for (let i = 1; i <= 10; i++) {
                    cell.cellNode.classList.remove(`stack-${i}`);
                }
            }
        }
    }

    handleRangeSelect = (event: MouseEvent, cell: IRenderedCell): void => {

        this._clearRange(this.currentRangeSelection)

        let currentRange = this.currentRangeSelection
        let indexes = this._getMinMax(currentRange, cell)

        currentRange.rows = []

        for (let i = indexes.minRow; i <= indexes.maxRow; i++) {
            let _row: IRenderedCell[] = []

            for (let j = indexes.minCol; j <= indexes.maxCol; j++) {
                _row.push(this.Grid.rows[i].renderedRow.cells[j])
            }

            currentRange.rows.push(_row)
        }

        currentRange.end.row = cell.rowModel
        currentRange.end.col = cell.colModel

        this._drawRanges()
    }

    _drawRanges() {

        let cellSelectCount = {}

        for (let range of this.rangeSelection) {
            let indexes = this._getMinMax(range)

            for (let i = indexes.minRow; i <= indexes.maxRow; i++) {

                for (let j = indexes.minCol; j <= indexes.maxCol; j++) {
                    let cell = this.Grid.rows[i].renderedRow.cells[j]

                    if (cellSelectCount[cell.cellId] == void 0) {
                        cellSelectCount[cell.cellId] = {count: 0, cell}
                    }

                    cellSelectCount[cell.cellId].count++

                    cell.cellNode.classList.add("selected")

                    if (i === indexes.minRow) {
                        cell.cellNode.classList.add("range-border-top")
                    }

                    if (i === indexes.maxRow) {
                        cell.cellNode.classList.add("range-border-bottom")
                    }

                    if (j === indexes.minCol) {
                        cell.cellNode.classList.add("range-border-left")
                    }

                    if (j === indexes.maxCol) {
                        cell.cellNode.classList.add("range-border-right")
                    }
                }
            }
        }

        for (let key in cellSelectCount) {
            let countObj = cellSelectCount[key]
            if (countObj.count > 10) {
                countObj.count = 10
            }

            countObj.cell.cellNode.classList.add(`stack-${countObj.count}`)
        }
    }

    _getMinMax(range, cell?) {
        let rangeStart = range.start
        let rangeEnd = range.end
        let colFirst = rangeStart.col.currentIndex
        let colLast = cell ? cell.colModel.currentIndex : rangeEnd.col.currentIndex
        let rowLast = cell ? cell.rowModel.index : rangeEnd.row.index
        let rowFirst = rangeStart.row.index

        return {
            minCol: Math.min(colFirst, colLast),
            maxCol: Math.max(colFirst, colLast),
            minRow: Math.min(rowFirst, rowLast),
            maxRow: Math.max(rowFirst, rowLast)
        }
    }

    onCellMouseLeave = (event: any, cell: IRenderedCell): void => {
        if (!this.Grid.ConfigController.isRangeSelect) {
            return
        }

        this.Grid.Utils.toggleClass("hover", cell.cellNode, false)
    }

    onCellMouseEnter = (event: any, cell: IRenderedCell): void => {

        if (!this.Grid.ConfigController.isRangeSelect) {
            return
        }

        if (this.isRangeSelectActive) {
            this.handleRangeSelect(event, cell)
            return
        }

        this.Grid.Utils.toggleClass("hover", cell.cellNode, true)
    }
}
