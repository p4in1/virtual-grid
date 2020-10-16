import {
    IVirtualColumnRowGroup,
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridDom
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridUIDomController} from "./virtual.grid.ui.dom.srv";

interface IVirtualDragData {
    x: number,
    y: number,
    col: IVirtualGridColumn,
    cell: HTMLElement
    rect: ClientRect,
    offset: number
}

interface IVirtualDragData {
    x: number,
    y: number,
    col: IVirtualGridColumn,
    cell: HTMLElement,
    rect: ClientRect,
    offset: number,
    pinned: string
}

export class VirtualGridDragAndDropController {
    dom: IVirtualGridDom
    domController: VirtualGridUIDomController

    isColDragActive: boolean = false;

    colDragData: IVirtualDragData

    ghostHeight: number = 40;
    ghostWidth: number = 0;

    scrollOffset: number = 0;
    scrollInterval;

    currentCursorX: number = 0

    groups: IVirtualColumnRowGroup[] = []

    constructor(private Grid: IVirtualGrid) {
        this.domController = this.Grid.domController
        this.dom = this.domController.dom
    }

    _removeGroup = (event): void => {
        let groupElement: HTMLElement = event.target.closest(".virtual-grid-group")
        if (groupElement) {
            let colId = groupElement.getAttribute("col-id")
            let col = this.Grid.columns.find(x => x.id == colId)
            col.api.removeRowGroup()
        }
    }

    onGroupPanelMouseEnter = (): void => {
        if (this.isColDragActive && !this.colDragData.col.isRowGrouped) {
            let element = this.Grid.Utils.el("div", ["virtual-grid-group", "inactive"], {"col-id": this.colDragData.col.id})
            let group: IVirtualColumnRowGroup = {
                index: this.groups.length,
                col: this.colDragData.col,
                element,
                removeButton: this.Grid.Utils.el("i", ["virtual-grid-group-remove-button", "virtual-material-icons", "small"]),
                label: this.colDragData.col.title,
                isActive: false
            }

            element.textContent = group.label
            element.appendChild(group.removeButton)

            group.removeButton.addEventListener("click", this._removeGroup)
            group.removeButton.textContent = "clear"

            this.groups.push(group)

            this.colDragData.col.isRowGrouped = true
            this.colDragData.col.rowGroup = group

            this.createGroupElements()
        }
    }

    onGroupPanelMouseLeave = (): void => {
        if (this.isColDragActive && this.colDragData.col.rowGroup.isActive === false) {
            this.colDragData.col.api.removeRowGroup()
        }
    }

    onGroupPanelMouseUp = (): void => {
        if (this.isColDragActive) {
            this.colDragData.col.rowGroup.element.classList.remove("inactive")
            this.colDragData.col.rowGroup.isActive = true
            this.applyGrouping()
        }
    }

    applyGrouping() {
        let s = +new Date()
        let rows
        let groupColumn = this.Grid.columns.find(x => x.isRowGroupColumn)
        let groupTree = {}

        if (this.groups.length > 0) {
            !groupColumn.isVisible && groupColumn.api.show()

            for (let row of this.Grid.rows) {
                if (!row.isRowGroup) {
                    this._addGroupRows(groupTree, row)
                }
            }

            rows = this._createGroupRows(groupTree)

        } else {
            groupColumn.api.hide()
            rows = this.Grid.ConfigController.originalRows
        }

        console.log("grouping took --> ", +new Date - s)

        this.Grid.api.updateGridRows(rows, false, true)
    }

    _createGroupRows(treePart) {

        let rows = []

        let keys = Object.keys(treePart).sort((a, b) => {
            return a.localeCompare(b)
        })

        for (let key of keys) {
            let rowNode: any = {isRowGroup: true}
            let childKey = this.Grid.ConfigController.childNodesKey
            rowNode.value = key
            rowNode[childKey] = []

            rows.push(rowNode)

            if (Object.keys(treePart[key].rowGroups).length > 0) {
                rowNode[childKey] = this._createGroupRows(treePart[key].rowGroups)
            } else {
                for (let _row of treePart[key].children) {
                    rowNode[childKey].push(_row.rowData)
                }
            }
        }

        return rows
    }

    _addGroupRows(rowGroupTree, row) {
        let currentNode = rowGroupTree

        for (let i = 0; i < this.groups.length; i++) {
            let currentGroup = this.groups[i]
            let value = row.getCellValue(currentGroup.col).trim()

            if (currentNode[value] == void 0) {
                currentNode[value] = {
                    children: [],
                    rowGroups: {}
                }
            }

            currentNode[value].children.push(row)

            if (i !== this.groups.length - 1) {
                currentNode = currentNode[value].rowGroups
            }
        }
    }

    createGroupElements() {
        let placeholder = this.dom.groupPanelPlaceholder

        placeholder.style.display = this.groups.length == 0 ? "block" : "none"

        this.dom.groupPanelContent.innerHTML = ""

        for (let i = 0; i < this.groups.length; i++) {
            this.dom.groupPanelContent.appendChild(this.groups[i].element)

            if (this.groups[i + 1] != void 0) {
                let spacer = this.Grid.Utils.el("i", ["virtual-grid-group-spacer", "virtual-material-icons", "small"])
                spacer.textContent = "trending_flat"
                this.dom.groupPanelContent.appendChild(spacer)
            }
        }
    }

    /**
     * Column drag event listener
     * @param event - the dom event
     * @param column - the column the event started with
     */
    onColDragStart = (event: any, column: IVirtualGridColumn): void => {
        let rect = column.dom.cellTextContainer.getBoundingClientRect();

        this.colDragData = {
            x: event.clientX,
            y: event.clientY,
            col: column,
            cell: column.dom.cellTextContainer,
            rect: rect,
            offset: this._getOffset(column, rect),
            pinned: column.pinned
        }

        let _onMove = (event) => {
            this.onColDrag(event, this.colDragData)
        }

        // cleanup event listeners and elements like the ghost
        let _onDragEnd = () => {
            document.body.removeEventListener("mousemove", _onMove)
            document.body.removeEventListener("mouseup", _onDragEnd)

            if (this.isColDragActive) {
                // remember the suppressSort state to later restore it
                // otherwise the column would start sorting once the drag is finished
                // this happens because the mouse down and the mouseup event trigger on the same element
                // at this point we try to prevent the click on this column from happening
                let suppressSort = this.colDragData.col.isSuppressSort;

                this.colDragData.col.isSuppressSort = true

                this.isColDragActive = false;
                this.scrollOffset = 0

                this.dom.virtualGrid.classList.remove("moving")
                this.dom.ghost.parentNode.removeChild(this.dom.ghost)

                clearInterval(this.scrollInterval)

                // restore the old suppressSort value
                setTimeout(() => {
                    this.colDragData.col.isSuppressSort = suppressSort
                }, 0)
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
        let currentX = event.clientX - data.offset + this.scrollOffset
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
     * scrolls the view horizontally when the user drags a column and the grid has some
     * spare space to scroll with
     * @param dragData
     * @private
     */
    private scrollHorizontally(dragData) {
        let scrollDirection = this.getScrollDirection(dragData.offset)

        if (scrollDirection) {
            clearTimeout(this.scrollInterval)

            this.scrollInterval = setInterval(() => {

                let scrollDirection = this.getScrollDirection(dragData.offset)

                if (scrollDirection == void 0) {
                    clearInterval(this.scrollInterval)
                    return
                }

                this.scrollOffset += scrollDirection == "left" ? -4 : 4;
                this.domController.dom.scrollYCenterScrollPort.scrollLeft += scrollDirection == "left" ? -4 : 4
            }, 12)
        }
    }

    /**
     * determine in which direction the viewport should scroll
     * @param offset - the offset left of the grid
     */
    getScrollDirection(offset) {
        let widths = this.domController.calculatePartialWidths()
        let scrollPortWidth = this.domController.scrollPortWidth
        let isScrollingRight = this.currentCursorX > widths.left + scrollPortWidth - 40
        let isScrollingLeft = this.currentCursorX < widths.left + 40
        let scrollLeft = this.Grid.eventController.scrollLeft
        let isScrolledToTheRight = scrollLeft + scrollPortWidth >= Math.round(widths.center)
        let isScrolledToTheLeft = scrollLeft === 0

        if (!isScrollingLeft && !isScrollingRight) {
            return null
        }

        if ((isScrolledToTheRight && isScrollingRight) || (isScrolledToTheLeft && isScrollingLeft)) {
            return null
        }

        return isScrollingRight ? "right" : "left"
    }

    /**
     * column drag handler
     * @param event
     * @param dragData - drag data
     */
    private onColDrag = (event, dragData: IVirtualDragData): void => {
        if (!this.isColDragActive && (Math.abs(dragData.x - event.clientX) > 8 || Math.abs(dragData.y - event.clientY) > 8)) {
            this.isColDragActive = true;
            this.dom.virtualGrid.classList.add("moving")
            this.dom.ghostLabel.textContent = dragData.col.title
            this.ghostWidth = this.Grid.Utils.getTextWidthInPixel(dragData.col.title) + 20

            document.body.appendChild(this.dom.ghost)
        }

        // moving the ghost
        if (this.isColDragActive) {
            let top = event.clientY - (this.ghostHeight / 2);
            let left = event.clientX - (this.ghostWidth / 2)

            this.domController.setStyles(this.dom.ghost, {
                top: `${top}px`,
                left: `${left}px`,
                width: `${this.ghostWidth}px`,
                height: `${this.ghostHeight}px`
            })

            let isOutOfBounds = top + this.ghostHeight < dragData.rect.top;

            if (!isOutOfBounds) {

                this.currentCursorX = event.clientX - dragData.offset

                let nextIndex = this.getCurrentColMoveIndex(dragData, event)
                if (nextIndex >= 0 && nextIndex < this.Grid.columns.length) {

                    this.scrollHorizontally(dragData)

                    if (!this.Grid.columns[nextIndex].isSuppressMoving) {
                        this.moveColumn(dragData.col.currentIndex, nextIndex)
                    }

                    this.checkPinState(dragData, event, nextIndex)
                }
            }
        }
    }

    checkPinState(dragData, event, nextIndex) {
        let width = this.Grid.domController.calculatePartialWidths()
        let currentX = event.clientX - dragData.offset + this.scrollOffset;

        if (currentX < width.left && dragData.col.pinned != "left") {
            this.pinColumn(dragData.col, "left", nextIndex)
        }

        if (currentX > width.left && currentX < (width.left + width.center) && dragData.col.pinned != "center") {
            this.pinColumn(dragData.col, "center", nextIndex)
        }

        if (currentX > (width.left + width.center) && dragData.col.pinned != "right") {
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

        this.Grid.eventController.adjustCell(this.Grid.columns, 0)
        this.Grid.eventController.updateGridWidth()
        this.domController.calculateScrollGuard()

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
            this.Grid.eventController.adjustCell([this.Grid.columns[fromIndex], this.Grid.columns[toIndex]], 0)

            let left = this.Grid.columns.filter(x => x.pinned == "left")
            let right = this.Grid.columns.filter(x => x.pinned == "right")

            if (toIndex < left.length) {
                this.pinColumn(this.Grid.columns[toIndex], "left", toIndex)
            } else if (toIndex > this.Grid.columns.length - right.length) {
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
