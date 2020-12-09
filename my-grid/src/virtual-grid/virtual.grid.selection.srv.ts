import {
    IRenderedCell,
    IVirtualGrid, IVirtualGridColumn,
    IVirtualGridRow, IVirtualRowCell,
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

        this.clearRangeSelection()
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

    public selectAll = (): void => {
        for (let row of this.Grid.rows) {
            this.selectRow(row)
        }
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

        this.clearRangeSelection()
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
            return
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

    private _clearRange(range: IVirtualRangeSelection) {
        for (let selectedRow of range.rows) {
            for (let cell of selectedRow) {
                let row: IVirtualGridRow = cell.row
                let col: IVirtualGridColumn = cell.col
                let virtualCell: IVirtualRowCell = row.cells.find(x => x.colModel.id == col.id)

                row.isRangeSelected = false

                virtualCell.stackCount = 0
                virtualCell.isSelected = false
                virtualCell.isBorderRight = false
                virtualCell.isBorderLeft = false
                virtualCell.isBorderBottom = false
                virtualCell.isBorderTop = false
            }
        }
    }

    handleRangeSelect = (event: MouseEvent, cell: IRenderedCell): void => {

        this._clearRange(this.currentRangeSelection)

        let currentRange = this.currentRangeSelection
        let indexes = this._getMinMax(currentRange, cell)

        currentRange.rows = []

        for (let i = indexes.minRow; i <= indexes.maxRow; i++) {
            let rangeRow: any[] = []

            for (let j = indexes.minCol; j <= indexes.maxCol; j++) {
                let row: IVirtualGridRow = this.Grid.rows[i]
                let cell = row.renderedRow.cells[j]
                rangeRow.push({col: cell.colModel, row: cell.rowModel})
            }

            currentRange.rows.push(rangeRow)
        }

        currentRange.end.row = cell.rowModel
        currentRange.end.col = cell.colModel

        this._setRanges()
    }

    _setRanges() {

        let cellSelectCount = {}

        for (let range of this.rangeSelection) {
            let indexes = this._getMinMax(range)

            for (let i = indexes.minRow; i <= indexes.maxRow; i++) {
                let row = this.Grid.rows[i]

                row.isRangeSelected = true

                for (let j = indexes.minCol; j <= indexes.maxCol; j++) {

                    let renderedCell = row.renderedRow.cells[j]
                    let virtualCell = row.cells.find(x => x.colModel.id == renderedCell.colModel.id)

                    if (cellSelectCount[renderedCell.cellId] == void 0) {
                        cellSelectCount[renderedCell.cellId] = {count: 0, renderedCell}
                    }

                    cellSelectCount[renderedCell.cellId].count++

                    virtualCell.isSelected = true
                    virtualCell.isBorderTop = i === indexes.minRow
                    virtualCell.isBorderBottom = i === indexes.maxRow
                    virtualCell.isBorderLeft = j === indexes.minCol
                    virtualCell.isBorderRight = j === indexes.maxCol
                }
            }
        }

        for (let key in cellSelectCount) {
            let countObj = cellSelectCount[key]
            if (countObj.count > 10) {
                countObj.count = 10
            }

            let row = countObj.renderedCell.rowModel
            let virtualCell: IVirtualRowCell = row.cells.find(x => x.colModel.id == countObj.renderedCell.colModel.id)

            virtualCell.stackCount = countObj.count
        }


        this.Grid.RowController.renderRows()
    }

    _getMinMax(range, cell?) {
        let rangeStart = range.start
        let rangeEnd = range.end.row == void 0 ? range.start : range.end
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

    isCellInRangeSelection(cell): boolean {

        let currentCol = cell.colModel.currentIndex
        let currentRow = cell.rowModel.index

        for (let range of this.rangeSelection) {
            let minMax = this._getMinMax(range)
            if (currentCol >= minMax.minCol && currentCol <= minMax.maxCol && currentRow >= minMax.minRow && currentRow <= minMax.maxRow) {
                return true;
            }
        }

        return false
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
