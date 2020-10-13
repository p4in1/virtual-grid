import {IRenderedRow, IVirtualGrid, IVirtualGridRow} from "./interfaces/virtual.grid.interfaces";

export class VirtualGridRow implements IVirtualGridRow {

    index: number;
    level: number = 0;

    rowData: any;

    children: IVirtualGridRow[] = [];
    childCountTotal: number = 0;

    initialIndex: number;

    isLoading: boolean;
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
