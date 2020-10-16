import {IVirtualGrid, IVirtualGridColumn, IVirtualGridColumnApi} from "./interfaces/virtual.grid.interfaces";

export class VirtualGridColumnApi implements IVirtualGridColumnApi {

    constructor(private Grid: IVirtualGrid, private col: IVirtualGridColumn) {

    }

    pin = (area: string = "center") => {
        this._addMovingClass(() => {
            this.Grid.DnDController.pinColumn(this.col, area)
        })
    }

    unpin = () => {
        this._addMovingClass(() => {
            this.Grid.DnDController.pinColumn(this.col, "center")
        })
    }

    move = (index) => {
        this._addMovingClass(() => {
            this.Grid.DnDController.moveColumn(this.col.currentIndex, index)
        })
    }

    /**
     * showing a column that has nevver been seen starts with 200px in width
     * otherwise we start with its width
     */
    show = () => {
        // set the width the column should now get
        let width = this.col.width == void 0 ? 200 : this.col.width

        // reset the width of the column to 0 to ensure the update function
        // works properly
        this.col.width = 0
        this._toggleVisibility(true, width)
    }

    hide = () => {
        this._toggleVisibility(false, -1 * this.col.width)
    }

    private _toggleVisibility(isVisible, width) {
        this.col.isVisible = isVisible
        this.Grid.eventController.updateCellWidth(this.col.currentIndex, width, true)
        this.Grid.eventController.updateGridWidth();
        this.Grid.domController.calculateScrollGuard()
    }

    removeRowGroup = () => {
        if (this.col.isRowGrouped) {
            for (let i = 0; i < this.Grid.DnDController.groups.length; i++) {
                let group = this.Grid.DnDController.groups[i]
                if (group.col.id == this.col.id) {
                    this.Grid.DnDController.groups.splice(i, 1)
                    break;
                }
            }

            this.col.isRowGrouped = false

            this.Grid.DnDController.createGroupElements()
            this.Grid.DnDController.applyGrouping()
        }
    }

    private _addMovingClass(func) {
        this.Grid.domController.dom.virtualGrid.classList.add("moving")

        func()

        setTimeout(() => {
            this.Grid.domController.dom.virtualGrid.classList.remove("moving")
        }, 250)
    }
}
