import {IRenderedRow, IVirtualGrid, IVirtualGridColumn, IVirtualGridRow} from "./interfaces/virtual.grid.interfaces";

export class VirtualGridRow implements IVirtualGridRow {

    index: number;
    level: number = 0;

    rowData: any;

    children: IVirtualGridRow[] = [];
    childCountTotal: number = 0;

    initialIndex: number;

    isLoading: boolean;
    isRowGroup: boolean = false
    isSelectable: boolean = true;
    isSelected: boolean = false;
    isVisible: boolean = true;
    isVisibleAfterFilter: boolean = true;

    renderedRow?: IRenderedRow

    parent?: IVirtualGridRow;
    isExpanded?: boolean = false;

    constructor(private Grid: IVirtualGrid, node: any, level: number = 0, parent?: IVirtualGridRow) {
        this.level = level;
        this.isSelectable = true;
        this.isSelected = !!node.isSelected;
        this.isVisible = parent == void 0 || parent != void 0 && parent.isExpanded;
        this.isRowGroup = node.isRowGroup

        if (parent != void 0) {
            this.parent = parent;
        }

        if (node[Grid.ConfigController.childNodesKey]) {
            this.isExpanded = Grid.ConfigController.expandNodesByDefault || node.expanded;
            this.isSelectable = Grid.ConfigController.useIntermediateNodes;
        }

        // TODO observe changes on the rowData
        // TODO 1. Define Getter and Setter in a generic way with Object.defineProperty https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
        // TODO 2. Use Proxies and intercept changes made to the object
        // if (typeof node == "object") {
        //     this.addProxy(node);
        // }

        this.rowData = node
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
     * @param stringify
     */
    public getCellValue = (col: IVirtualGridColumn, stringify: boolean = true): string => {
        let cellData: any = this.Grid.RowController.getCellData(this.rowData, col.fieldPath);
        let cellValue: string;
        let cell: any = {
            rowModel: this.Grid.rows[this.index],
            colModel: this.Grid.originalColumns[col.index]
        };

        if (typeof cell.colModel.cellRenderer === "function") {
            cellValue = cell.colModel.cellRenderer(cell)
        } else if (typeof cell.colModel.cellValueGetter === "function") {
            cellValue = cell.colModel.cellValueGetter(cell, cellData)
        } else {
            cellValue = cellData
        }
        if (typeof cell.colModel.cellValueFormatter == "function") {
            cellValue = cell.colModel.cellValueFormatter(cell, cellData)
        }

        return stringify ? Array.isArray(cellValue) ? cellData.join(" ") : cellValue.toString() : cellValue
    }

    // private renderRow() {
    //     // TODO - when reordering rows the grid should attach the rendered row to the row model
    //     // TODO - Attach the rendered Row to the row model and remove the row model once the row leaves the viewport and
    //     // TODO - would be reused for another row model .. this avoids the use of a for..loop
    //     // let renderedRows: RenderedRow[] = this.Grid.UI.domController.renderedRows;
    //     //
    //     // for (let renderedRow of renderedRows) {
    //     //     const number: number = Number(renderedRow.element.getAttribute("number"));
    //     //     if (number == this.index) {
    //     //         this.Grid.RowController.renderRow(renderedRow);
    //     //         break;
    //     //     }
    //     // }
    // };

    // private addProxy(node: any): void {
    //
    //     let debounce: any = null;
    //     let _this = this;
    //     this.rowData = new Proxy(node, {
    //         set: function (target, prop, value) {
    //             console.log({type: 'set', target, prop, value});
    //
    //             clearTimeout(debounce);
    //
    //             debounce = setTimeout(() => {
    //                 _this.renderRow()
    //             }, 0);
    //
    //             return Reflect.set(target, prop, value);
    //         }
    //     });
    // }
}
