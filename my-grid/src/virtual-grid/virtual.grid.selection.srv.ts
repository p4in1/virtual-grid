import {
    IRenderedCell,
    IVirtualGrid,
    IVirtualGridConfig, IVirtualGridRow,
} from "./interfaces/virtual.grid.interfaces";

export class VirtualGridSelectionController {

    selectedRows: IVirtualGridRow[] = []

    isRangeSelectActive: boolean = false

    rangeSelection: any = {
        start: {},
        end: {},
        range: []
    }

    constructor(private Grid: IVirtualGrid, private config: IVirtualGridConfig) {

    }

    getSelection() {
        if (this.config.selectionMethod == "range") {
            return this.rangeSelection
        } else {
            return this.selectedRows
        }
    }

    onCellMouseDown = (event: any, cell: IRenderedCell): void => {

        if (event.buttons != 1) {
            let colFirst = this.rangeSelection.start.col.currentIndex
            let colLast = this.rangeSelection.end.col.currentIndex
            let rowFirst = this.rangeSelection.start.row.index
            let rowLast = this.rangeSelection.end.row.index

            let minColIndex = Math.min(colFirst, colLast)
            let maxColIndex = Math.max(colFirst, colLast)
            let minRowIndex = Math.min(rowFirst, rowLast)
            let maxRowIndex = Math.max(rowFirst, rowLast)

            let currentCol = cell.colModel.currentIndex
            let currentRow = cell.rowModel.index
            if (currentCol >= minColIndex && currentCol <= maxColIndex && currentRow >= minRowIndex && currentRow <= maxRowIndex) {
                return;
            }
        }

        if (this.Grid.ConfigController.selectionMethod != "range") {
            return
        }

        this._clearRangeSelection()

        this.isRangeSelectActive = true
        this.rangeSelection.start.row = cell.rowModel
        this.rangeSelection.start.col = cell.colModel
        this.rangeSelection.range = []

        const _unbind = (): void => {

            this.isRangeSelectActive = false;

            window.removeEventListener("mouseup", _unbind)
        }

        window.addEventListener("mouseup", _unbind);
    }

    private _clearRangeSelection = (): void => {
        for (let selectedRow of this.rangeSelection.range) {
            for (let cell of selectedRow) {
                cell.cellNode.classList.remove("selected")
            }
        }

        this.rangeSelection.range = []
    }

    handleRangeSelect = (cell: IRenderedCell): void => {

        this._clearRangeSelection()

        let minColIndex = Math.min(this.rangeSelection.start.col.currentIndex, cell.colModel.currentIndex)
        let maxColIndex = Math.max(this.rangeSelection.start.col.currentIndex, cell.colModel.currentIndex)
        let minRowIndex = Math.min(this.rangeSelection.start.row.index, cell.rowModel.index)
        let maxRowIndex = Math.max(this.rangeSelection.start.row.index, cell.rowModel.index)

        for (let i = minRowIndex; i <= maxRowIndex; i++) {
            let _row = []
            for (let j = minColIndex; j <= maxColIndex; j++) {
                let cell = this.Grid.domController.renderedRows[i].cells[j]

                cell.cellNode.classList.add("selected")

                _row.push(cell)
            }

            this.rangeSelection.range.push(_row)
        }

        this.rangeSelection.end.row = cell.rowModel
        this.rangeSelection.end.col = cell.colModel
    }

    onCellMouseLeave = (event: any, cell: IRenderedCell): void => {
        if (this.Grid.ConfigController.selectionMethod != "range") {
            return
        }

        this.Grid.Utils.toggleClass("hover", cell.cellNode, false)
    }

    onCellMouseEnter = (event: any, cell: IRenderedCell): void => {

        if (this.Grid.ConfigController.selectionMethod != "range") {
            return
        }

        if (this.isRangeSelectActive) {
            this.handleRangeSelect(cell)
            return
        }

        this.Grid.Utils.toggleClass("hover", cell.cellNode, true)
    }
}
