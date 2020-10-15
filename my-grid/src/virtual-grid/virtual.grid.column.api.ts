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

    show = () => {
        this._toggleVisibility(true, 200)
    }

    hide = () => {
        this._toggleVisibility(false, -200)
    }

    private _toggleVisibility(isVisible, width) {
        this.col.isVisible = isVisible
        this.Grid.eventController.updateCellWidth(this.col.currentIndex, width)
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
