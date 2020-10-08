import {IVirtualGrid, IVirtualGridColumn, IVirtualGridDom} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridUIDomController} from "./virtual.grid.ui.dom.srv";

interface IVirtualDragData {
    x: number,
    y: number,
    col: IVirtualGridColumn,
    cell: HTMLElement
    rect: ClientRect,
    offset: number
}

export class VirtualGridDragAndDropController {
    dom: IVirtualGridDom
    domController: VirtualGridUIDomController

    isGhostAttached: boolean = false;
    ghostHeight: number = 40;
    ghostWidth: number = 0;

    constructor(private Grid: IVirtualGrid, private config: any) {
        this.domController = this.Grid.UI.domController
        this.dom = this.domController.dom
    }

    /**
     * Column drag event listener
     * @param event - the dom event
     * @param column - the column the event started with
     */
    onColDragStart = (event: any, column): void => {
        let rect = column.dom.cellTextContainer.getBoundingClientRect();
        let data = {
            x: event.clientX,
            y: event.clientY,
            col: column,
            cell: column.dom.cellTextContainer,
            rect: rect,
            offset: this._getOffset(column, rect),
            pinned: column.pinned
        }

        let _onMove = (event) => {
            this.onColDrag(event, data)
        }

        // cleanup event listeners and elements like the ghost
        let _onDragEnd = () => {
            document.body.removeEventListener("mousemove", _onMove)
            document.body.removeEventListener("mouseup", _onDragEnd)

            if (this.isGhostAttached) {
                this.isGhostAttached = false;
                this.dom.virtualGrid.classList.remove("moving")
                this.dom.ghost.parentNode.removeChild(this.dom.ghost)
            }
        }

        // bind global listener so the mouse can move freely
        document.body.addEventListener("mousemove", _onMove)
        document.body.addEventListener("mouseup", _onDragEnd)
    }

    /**
     * returns the index where the ghost element is at this moment
     * @param data
     * @param event
     * @private
     */
    private getCurrentColMoveIndex(data, event) {
        let currentX = event.clientX - data.offset
        let isMovingLeft = event.clientX - data.x < 0

        let left = 0;

        for (let _col of this.Grid.columns) {
            let right = _col.width + left
            let middle = right - (_col.width / 2)
            let isSameColumn = data.col.id == _col.id

            if (currentX > middle && currentX < right) {
                return isSameColumn || !isMovingLeft ? _col.currentIndex : _col.currentIndex + 1
            } else if (currentX < middle && currentX > left) {
                return isSameColumn || isMovingLeft ? _col.currentIndex : _col.currentIndex - 1
            } else {
                left += _col.width
            }
        }
    }

    /**
     * column drag handler
     * @param event
     * @param dragData - drag data
     */
    private onColDrag = (event, dragData: IVirtualDragData): void => {
        if (!this.isGhostAttached && (Math.abs(dragData.x - event.clientX) > 8 || Math.abs(dragData.y - event.clientY) > 8)) {
            this.isGhostAttached = true;
            this.dom.virtualGrid.classList.add("moving")
            this.dom.ghostLabel.textContent = dragData.col.title
            this.ghostWidth = this.Grid.Utils.getTextWidthInPixel(dragData.col.title) + 20

            document.body.appendChild(this.dom.ghost)
        }

        // moving the ghost
        if (this.isGhostAttached) {
            let top = event.clientY - (this.ghostHeight / 2);
            let left = event.clientX - (this.ghostWidth / 2)

            this.domController.setStyles(this.dom.ghost, {
                transform: `translateX(${left}px) translateY(${top}px)`,
                width: `${this.ghostWidth}px`,
                height: `${this.ghostHeight}px`
            })

            let isOutOfBounds = top + this.ghostHeight < dragData.rect.top;

            if (!isOutOfBounds) {
                let nextIndex = this.getCurrentColMoveIndex(dragData, event)
                this.moveColumn(dragData.col.currentIndex, nextIndex)
                this.checkPinState(dragData, event, nextIndex)
            }
        }
    }

    checkPinState(dragData, event, nextIndex) {
        let width = this.Grid.UI.domController.calculatePartialWidths()
        let currentX = event.clientX - dragData.offset;

        if (currentX < width.bodyLeftWidth && dragData.col.pinned != "left") {
            this.pinColumn(dragData.col, "left", nextIndex)
        }

        if (currentX > width.bodyLeftWidth && currentX < (width.bodyLeftWidth + width.bodyCenterWidth) && dragData.col.pinned != "center") {
            this.pinColumn(dragData.col, "center", nextIndex)
        }

        if (currentX > (width.bodyLeftWidth + width.bodyCenterWidth) && dragData.col.pinned != "right") {
            this.pinColumn(dragData.col, "right", nextIndex)
        }
    }

    /**
     * pins a column to a given area
     * @param column
     * @param area - the area to pin the column to - left , center , right
     * @param index - the index to where the column should be pinned
     */
    pinColumn = (column: IVirtualGridColumn, area, index?) => {

        if (area == column.pinned) {
            return
        }

        let headerElement = area == "left" ? this.dom.headerLeft : area == "right" ? this.dom.headerRight : this.dom.headerCenter

        if (index == void 0) {
            let left = this.Grid.columns.filter(x => x.pinned == "left")
            let right = this.Grid.columns.filter(x => x.pinned == "right")

            index = area == "left" ? left.length : this.Grid.columns.length - right.length - 1
        }

        if (column.currentIndex != index) {
            this.moveColumn(column.currentIndex, index)
        }

        column.dom.cell.parentNode.removeChild(column.dom.cell)

        headerElement.appendChild(column.dom.cell)

        for (let row of this.domController.renderedRows) {
            let cell = row.cells[column.currentIndex].cellNode
            cell.parentNode.removeChild(cell)
            row[area].element.appendChild(cell)
        }

        column.pinned = area
        column.isPinned = ["left", "right"].includes(column.pinned)

        this.Grid.ColumnController.setCurrentColumnIndex()
        this.Grid.UI.eventController.updateGridWidth()
        this.Grid.UI.eventController.adjustCell(this.Grid.columns, 0)

    }
    /**
     * moves a column from one index to another
     * @param fromIndex
     * @param toIndex
     */
    moveColumn = (fromIndex, toIndex) => {
        if (toIndex != void 0 && toIndex != fromIndex) {
            //     //swap the columns
            this._moveArrayItem(this.Grid.columns, fromIndex, toIndex)

            this.Grid.ColumnController.setCurrentColumnIndex()

            //swap the cells according to the columns
            for (const row of this.domController.renderedRows) {
                this._moveArrayItem(row.cells, fromIndex, toIndex)
            }

            // set width and left
            this.Grid.UI.eventController.adjustCell([this.Grid.columns[fromIndex], this.Grid.columns[toIndex]], 0)

            let left = this.Grid.columns.filter(x => x.pinned == "left")
            let right = this.Grid.columns.filter(x => x.pinned == "right")

            if (toIndex < left.length) {
                this.pinColumn(this.Grid.columns[toIndex], "left", toIndex)
            }else if (toIndex > this.Grid.columns.length - right.length) {
                this.pinColumn(this.Grid.columns[toIndex], "right", toIndex)
            }
        }
    }

    /**
     * returns the left offset of the grid relative to the document body
     * @param column - the dragging column
     * @param rect - bounding client rect of the column's text node
     * @private
     */
    private _getOffset(column, rect: ClientRect) {
        let left = 0;

        for (let col of this.Grid.columns) {
            if (col.id == column.id) {
                break;
            }

            left += col.width
        }

        return rect.left - left
    }

    /**
     * moves one item in an array to another index
     * @param array - the array to operate with
     * @param startIndex - startIndex
     * @param endIndex - the destination index
     * @private
     */
    private _moveArrayItem(array, startIndex, endIndex) {
        if (endIndex === startIndex) {
            return array;
        }

        let target = array[startIndex];
        let increment = endIndex < startIndex ? -1 : 1;

        for (let k = startIndex; k != endIndex; k += increment) {
            array[k] = array[k + increment];
        }

        array[endIndex] = target;

        return array;
    }
}
