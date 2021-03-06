import {
    IRenderedRow,
    IVirtualGetCellValueOptions,
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridRow, IVirtualRowCell
} from "./interfaces/virtual.grid.interfaces";

export class VirtualGridRow implements IVirtualGridRow {

    index: number;
    level: number = 0;

    rowData: any;

    children: IVirtualGridRow[] = [];
    childCountTotal: number = 0;

    initialIndex: number;

    isRowGroup: boolean = false
    isRangeSelected: boolean = false;
    isSelectable: boolean = true;
    isSelected: boolean = false;
    isVisible: boolean = true;
    isVisibleAfterFilter: boolean = true;

    renderedRow?: IRenderedRow

    parent?: IVirtualGridRow;
    isExpanded?: boolean = false;

    cells: IVirtualRowCell[] = []

    constructor(private Grid: IVirtualGrid, node: any, level: number = 0, parent?: IVirtualGridRow) {
        this.level = level;
        this.isSelectable = true;
        this.isRangeSelected = false
        this.isSelected = !!node.isSelected;
        this.isVisible = parent == void 0 || parent != void 0 && parent.isExpanded;
        this.isRowGroup = node.isRowGroup

        if (parent != void 0) {
            this.parent = parent;
        }

        if (node[Grid.ConfigController.childNodesKey]) {
            this.isExpanded = node.isExpanded == void 0 ? Grid.ConfigController.expandNodesByDefault : node.isExpanded;
            this.isSelectable = !Grid.ConfigController.selectLeavesOnly || Grid.ConfigController.isParentChildSelection;
        }

        this.rowData = node

        for (let col of this.Grid.columns) {
            this.cells.push({
                isBorderBottom: false,
                isBorderLeft: false,
                isBorderRight: false,
                isBorderTop: false,
                isSelected: false,
                colModel: col,
                renderedCell: null,
                stackCount: 0
            })
        }
    }

    public updateRowData(rowData: any): void {
        for (const key in rowData) {
            let newValue = rowData[key];
            switch (typeof (newValue)) {
                case "string":
                case "number":
                    if (this.rowData[key] != rowData[key]) {
                        this.rowData[key] = rowData[key]
                    }
            }
        }
    };

    /**
     * returns the cell value of a given row and column
     *
     * filter prioritization
     * 1. cellRenderer              -> this might not have the highest value, but if there is a cellRenderer, the content of the cell is all we have
     * 2. cellValueGetter           -> this should return the value of the cell
     * 3. data type as Array        -> there is a special need in case the cellContent is an array .. we have to join the array
     * 4. data type of the column   -> this is the lowest priority but the highest probability and we interpret the datatype which should not be problematic
     *
     * @param col
     * @param options
     */
    public getCellValue = (col: IVirtualGridColumn, options: IVirtualGetCellValueOptions = {}): string => {
        let cellValue: string;
        let cellData: any;
        let cell: any = {
            rowModel: this.Grid.rows[this.index],
            colModel: this.Grid.originalColumns[col.index]
        };

        cellData = this.Grid.RowController.getCellData(this.rowData, col.fieldPath);

        options.stringify = options.stringify == void 0 ? true : options.stringify
        options.format = options.format == void 0 ? true : options.format

        if (this.isRowGroup && col.aggFunc && !col.aggregateRowGroups) {
            return ""
        }

        if (typeof cell.colModel.cellRenderer === "function") {
            cellValue = cell.colModel.cellRenderer(cell)
        } else if (typeof cell.colModel.cellValueGetter === "function") {
            cellValue = cell.colModel.cellValueGetter(cell, cellData)
        } else {
            cellValue = cellData
        }

        if (options.format) {
            if (typeof cell.colModel.cellValueFormatter == "function") {
                cellValue = cell.colModel.cellValueFormatter(cell, cellValue)
            }
        }

        return !options.stringify ? cellValue : col.colType == "multiLine" && Array.isArray(cellValue) ? cellValue.join(" ") : cellValue.toString()
    }

    /**
     * remove this row from the grid
     */
    public remove = () => {
        this.Grid.api.removeRow(this)
    }

    /**
     * overwrite the current rowData object
     * @param data - new rowData object
     */
    public setData = (data) => {
        this.rowData = data

        if (this.renderedRow && this.renderedRow.index == this.index) {
            this.Grid.RowController.renderRow(this.renderedRow, true)
        }
    }

    public addNode = (rowNode): IVirtualGridRow => {
        return this.Grid.api.addRow(this, rowNode)
    }
}
