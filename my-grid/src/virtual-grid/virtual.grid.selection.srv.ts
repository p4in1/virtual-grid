import {
    IRenderedCell,
    IVirtualGrid,
    IVirtualGridRow,
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";

interface IVirtualRangeSelection {
    start: any,
    end: any,
    range: any[]
}

export class VirtualGridSelectionController {

    selectedRows: IVirtualGridRow[] = []

    isRangeSelectActive: boolean = false

    rangeSelection: IVirtualRangeSelection = {
        start: {},
        end: {},
        range: []
    }

    constructor(private Grid: IVirtualGrid, private config: VirtualGridConfigController) {

    }

    getSelection(): any {
        if (this.config.selectionMethod == "range") {
            return this.rangeSelection
        } else {
            return this.selectedRows
        }
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
        if ((!useCtrl && !useShift) || this.config.selectionMethod !== "multi") {
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

        if (this.Grid.ConfigController.selectionMethod != "range") {
            return
        }

        if (event.buttons != 1) {

            let rangeStart = this.rangeSelection.start
            let rangeEnd = this.rangeSelection.end
            let colFirst = rangeStart.col.currentIndex
            let colLast = rangeEnd.col.currentIndex
            let rowFirst = rangeStart.row.index
            let rowLast = rangeEnd.row.index

            let minCol = Math.min(colFirst, colLast)
            let maxCol = Math.max(colFirst, colLast)
            let minRow = Math.min(rowFirst, rowLast)
            let maxRow = Math.max(rowFirst, rowLast)

            let currentCol = cell.colModel.currentIndex
            let currentRow = cell.rowModel.index
            if (currentCol >= minCol && currentCol <= maxCol && currentRow >= minRow && currentRow <= maxRow) {
                return;
            }
        }

        this.clearRangeSelection()

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

    public clearRangeSelection = (): void => {

        for (let selectedRow of this.rangeSelection.range) {
            for (let cell of selectedRow) {
                cell.cellNode.classList.remove("selected")
            }
        }

        this.rangeSelection.range = []
    }

    handleRangeSelect = (cell: IRenderedCell): void => {

        this.clearRangeSelection()

        let minColIndex = Math.min(this.rangeSelection.start.col.currentIndex, cell.colModel.currentIndex)
        let maxColIndex = Math.max(this.rangeSelection.start.col.currentIndex, cell.colModel.currentIndex)
        let minRowIndex = Math.min(this.rangeSelection.start.row.index, cell.rowModel.index)
        let maxRowIndex = Math.max(this.rangeSelection.start.row.index, cell.rowModel.index)

        for (let i = minRowIndex; i <= maxRowIndex; i++) {
            let _row = []
            for (let j = minColIndex; j <= maxColIndex; j++) {
                let cell = this.Grid.rows[i].renderedRow.cells[j]
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
