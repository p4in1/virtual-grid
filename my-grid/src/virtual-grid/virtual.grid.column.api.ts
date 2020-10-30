import {
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridColumnApi,
} from "./interfaces/virtual.grid.interfaces";

export class VirtualGridColumnApi implements IVirtualGridColumnApi {

    constructor(private Grid: IVirtualGrid, private col: IVirtualGridColumn) {

    }

    /**
     * pins the column at the given area
     * @param area
     */
    pin = (area: string = "center") => {
        this._addMovingClass(() => {
            this.Grid.DnDController.pinColumn(this.col, area)
        })
    }

    /**
     * unpins the column
     */
    unpin = () => {
        this._addMovingClass(() => {
            this.Grid.DnDController.pinColumn(this.col, "center")
        })
    }

    /**
     * moves the column to the given index
     * @param index
     */
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
        let width = !this.col.width ? 200 : this.col.width

        // reset the width of the column to 0 to ensure the update function
        // works properly
        this.col.width = 0
        this._toggleVisibility(true, width)
    }

    /**
     * hides the column
     */
    hide = () => {
        this._toggleVisibility(false, -1 * this.col.width)
    }

    /**
     * adds this column to the row grouping
     */
    setRowGroup = () => {
        let rowGroup = this.Grid.DnDController.groups.find(x => x.col.id == this.col.id)
        if (!this.col.isRowGrouped || !rowGroup) {
            this.Grid.DnDController._addGroup(this.col, true)
            this.Grid.DnDController.applyGrouping()
        }
    }

    /**
     * removes this column to the row grouping
     */
    removeRowGroup = () => {
        if (this.col.isRowGrouped) {
            for (let i = 0; i < this.Grid.DnDController.groups.length; i++) {
                let group = this.Grid.DnDController.groups[i]
                if (group.col.id == this.col.id) {
                    this.Grid.DnDController.groups.splice(i, 1)
                    this.col.isRowGrouped = false
                    this.Grid.DnDController.createGroupElements()

                    if (group.isActive) {
                        this.Grid.DnDController.applyGrouping()
                    }
                    break;
                }
            }
        }
    }

    sizeToFit = () => {
        let col = this.col
        let cellWidth: number = 0;
        for (const row of this.Grid.rows) {
            let value = row.getCellValue(col)
            let _width: number = this.Grid.Utils.getTextWidthInPixel(value)

            cellWidth = _width < cellWidth ? cellWidth : _width
        }

        cellWidth = col.maxWidth && cellWidth > col.maxWidth ? col.maxWidth : col.width < cellWidth ? Math.floor(cellWidth) : cellWidth

        let width = col.width == void 0 ? cellWidth : cellWidth - col.width
        this._updateCellWidth(width)
    }

    private _toggleVisibility(isVisible, width) {
        this.col.isVisible = isVisible
        this._updateCellWidth(width)
    }

    private _updateCellWidth(width) {
        this.Grid.eventController.updateCellWidth(this.col.currentIndex, width, true)
        this.Grid.eventController.updateGridWidth();
        this.Grid.domController.calculateScrollGuard()
    }

    private _addMovingClass(func) {
        this.Grid.domController.dom.virtualGrid.classList.add("moving")

        func()

        setTimeout(() => {
            this.Grid.domController.dom.virtualGrid.classList.remove("moving")
        }, 250)
    }
}
