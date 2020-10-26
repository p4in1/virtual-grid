import {
    IRenderedCell,
    IRenderedRow,
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridDom,
    IVirtualGridRow
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridUIDomController} from "./virtual.grid.ui.dom.srv";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";

export class VirtualGridUIEventController {

    private dom: IVirtualGridDom;

    private globalResizeObserver;

    scrollLeft: number = 0

    constructor(private Grid: IVirtualGrid, private config: VirtualGridConfigController, private domController: VirtualGridUIDomController) {
        this.dom = domController.dom;
    }

    /**
     * onClick callback
     * @param event - the click event
     */
    private onClick = (event: any): void => {

        const row: IVirtualGridRow = this.getRowByEvent(event);
        const ctrlSelection = event.ctrlKey || this.Grid.ConfigController.useCheckboxSelection

        if (row.isSelectable && this.Grid.ConfigController.selectionMethod != "range") {
            this.Grid.api.select(row, ctrlSelection, event.shiftKey);
        }

        this.config.onRowClick({row, event, api: this.Grid.api});
    };

    /**
     * onDoubleClick callback
     * @param event - the click event
     */
    private onDoubleClick = (event: any): void => {
        const row: IVirtualGridRow = this.getRowByEvent(event);

        if (!this.Grid.ConfigController.useCheckboxSelection && this.Grid.ConfigController.selectionMethod != "range" && row.isSelectable) {
            this.Grid.api.select(row);
        }

        this.config.onRowDoubleClick({row, event, api: this.Grid.api});
    };

    /**
     * onRightClick callback
     * @param event - the click event
     */
    private onRightClick = (event: any): void => {
        const row: IVirtualGridRow = this.getRowByEvent(event);
        this.config.onRowRightClick({row, event, api: this.Grid.api});
    };

    private _toggleHoverState(row: IVirtualGridRow, isHover: boolean) {
        [row.renderedRow.left, row.renderedRow.center, row.renderedRow.right].forEach((rowPartial) => {
            this.Grid.Utils.toggleClass("hover", rowPartial.element, isHover)
        })
    }

    /**
     * onMouseEnter callback
     * @param event - the click event
     */
    private onMouseEnter = (event: any): void => {
        const row: IVirtualGridRow = this.getRowByEvent(event);
        this._toggleHoverState(row, true)
        this.config.onRowMouseEnter({row, event, api: this.Grid.api});
    };

    /**
     * onRightClick callback
     * @param event - the click event
     */
    private onMouseLeave = (event: any): void => {
        const row: IVirtualGridRow = this.getRowByEvent(event);
        this._toggleHoverState(row, false)
        this.config.onRowMouseLeave({row, event, api: this.Grid.api});
    };

    private onCellMouseEnter = (event: any, cell: IRenderedCell): void => {

        if (this.Grid.ConfigController.selectionMethod != "range") {
            return
        }

        if (this.isRangeSelectActive) {
            this.handleRangeSelect(cell)
            return
        }

        this.Grid.Utils.toggleClass("hover", cell.cellNode, true)
    }

    private onCellRightClick = (event: any, cell: IRenderedCell): void => {
        if (!this.config.suppressContextmenu) {
            this.Grid.ContextmenuController.showMenu(cell.rowModel, cell.colModel, event)
        }
    }


    private _clearRangeSelection = (): void => {
        for (let selectedRow of this.rangeSelect.selection) {
            for (let cell of selectedRow) {
                cell.cellNode.classList.remove("selected")
            }
        }

        this.rangeSelect.selection = []
    }

    private handleRangeSelect = (cell: IRenderedCell): void => {

        this._clearRangeSelection()

        let minColIndex = Math.min(this.rangeSelect.start.col.currentIndex, cell.colModel.currentIndex)
        let maxColIndex = Math.max(this.rangeSelect.start.col.currentIndex, cell.colModel.currentIndex)
        let minRowIndex = Math.min(this.rangeSelect.start.row.index, cell.rowModel.index)
        let maxRowIndex = Math.max(this.rangeSelect.start.row.index, cell.rowModel.index)

        for (let i = minRowIndex; i <= maxRowIndex; i++) {
            let _row = []
            for (let j = minColIndex; j <= maxColIndex; j++) {
                let cell = this.Grid.domController.renderedRows[i].cells[j]

                cell.cellNode.classList.add("selected")

                _row.push(cell)
            }

            this.rangeSelect.selection.push(_row)
        }
    }

    private onCellMouseLeave = (event: any, cell: IRenderedCell): void => {
        if (this.Grid.ConfigController.selectionMethod != "range") {
            return
        }

        this.Grid.Utils.toggleClass("hover", cell.cellNode, false)
    }

    rangeSelect: any = {
        start: {},
        selection: []
    }
    isRangeSelectActive: boolean = false

    private onCellMouseDown = (event: any, cell: IRenderedCell): void => {
        if (this.Grid.ConfigController.selectionMethod != "range") {
            return
        }

        this._clearRangeSelection()

        this.isRangeSelectActive = true
        this.rangeSelect = {
            start: {
                row: cell.rowModel,
                col: cell.colModel
            },
            selection: []
        }

        const _unbind = (): void => {

            this.isRangeSelectActive = false;

            window.removeEventListener("mouseup", _unbind)
        }

        window.addEventListener("mouseup", _unbind);
    }


    /**
     * catch the scroll event of the scroll guard and apply it to the body and the header
     */
    private onBodyScrollX = (): void => {
        this.scrollLeft = this.dom.scrollYCenterScrollPort.scrollLeft

        this.dom.bodyCenterScrollPort.scrollLeft = this.scrollLeft
        this.dom.headerCenterScrollPort.scrollLeft = this.scrollLeft

        this.domController.setShadow()
    }

    /**
     * on scroll callback
     */
    private onScroll = (): void => {
        if (this.config.showHeader) {
            this.dom.headerWrapper.scrollLeft = this.dom.bodyWrapper.scrollLeft;
        }

        this._onScroll()
    };

    /**
     * the resize event of the header resize handle
     * @param {IVirtualGridColumn} col
     * @param {Object} event
     */
    public onResize = (col: IVirtualGridColumn, event): void => {

        let currentX: number = event.screenX;

        const _resize = (event: any): void => {

            let diff: number = -(currentX - event.screenX);

            if (diff == 0) {
                return;
            }

            currentX += diff

            this.updateCellWidth(col.currentIndex, diff)
            this.updateGridWidth()
            this.domController.calculateScrollGuard()
        }

        const _unbind = (): void => {
            window.removeEventListener("mousemove", _resize)
            window.removeEventListener("mouseup", _unbind)
        }

        window.addEventListener("mousemove", _resize);
        window.addEventListener("mouseup", _unbind);
    };

    bindGlobalOnResize() {
        if (window["ResizeObserver"]) {
            this.globalResizeObserver = new window["ResizeObserver"]((a) => {

                requestAnimationFrame(() => {
                    this.domController.bodyWrapperWidth = Math.floor(a[0].contentRect.width)
                    this.domController.bodyWrapperHeight = Math.floor(a[0].contentRect.height)

                    this.updateCellWidth()
                    this.updateGridWidth();
                    this.domController.calculateScrollGuard()
                })
            });

            this.globalResizeObserver.observe(this.config.element);
        } else {
            console.warn("resizing not possible")
        }
    }

    /**
     * calculates and updates the column widths of all columns starting from the startIndex
     * at this point we calculate the relative width of a column once something changed according to the configuration
     * off all columns whether they can grow or shrink
     * the calculation starts periodically every 16ms caused by the use of a requestAnimationFrame
     * @param {number} start - the index to start calculating from
     * @param {number} diff - the difference in width for the given column from the start parameter
     * @param {boolean} isVisibilityChange - indicates that the visibility of a column has changed
     */
    public updateCellWidth = (start?: number, diff?: number, isVisibilityChange?: boolean): void => {

        let startColumn = this.Grid.columns[start];
        let nextColumn = this.Grid.columns[start + 1]

        let isLeftPinResizing = start != void 0 && startColumn.pinned === "left"
        let isRightPinResizing = start != void 0 && nextColumn.pinned === "right"


        let centerColumns = this.Grid.columns.filter(x => x.pinned == "center")

        // correct the difference in case the resizable column is at its minimum
        // we need to do this because this is just a workaround for a much bigger problem when
        // you want to resize smaller than you can
        if (diff < 0 && !isRightPinResizing) {
            if (isVisibilityChange != true && startColumn.width + diff <= startColumn.minWidth) {
                diff = 0
            }
        } else if (diff > 0 && isRightPinResizing) {
            if (isVisibilityChange != true && nextColumn.width - diff <= nextColumn.minWidth) {
                diff = 0
            }
        }

        if (start != void 0) {
            let startCol = isRightPinResizing ? [nextColumn] : [startColumn]
            let startDiff = isRightPinResizing ? -1 * diff : diff
            let colDiff = isRightPinResizing ? diff : -1 * diff
            let isGrowing = isRightPinResizing ? diff > 0 : diff < 0
            let columns = isRightPinResizing || isLeftPinResizing ? centerColumns : centerColumns.filter(x => x.currentIndex > start)
            let widths = this.domController.calculatePartialWidths()
            let diffToClose = this.domController.isHorizontalScrolling ? widths.center - this.domController.scrollPortWidth : 0
            let autosizableCols: IVirtualGridColumn[] = this.getAutoSizableColumns(columns, isGrowing);
            let diffPerColumn: number = autosizableCols.length > 0 ? (colDiff - diffToClose) / autosizableCols.length : 0

            this.adjustCell(startCol, startDiff);
            this.adjustCell(autosizableCols, diffPerColumn);

        } else {
            let isVerticalScrolling: boolean = this.Grid.ColumnController.isVerticalScrolling;
            let scrollbarWidth = isVerticalScrolling ? this.Grid.ColumnController.scrollbarWidth : 0;

            let width = this.domController.calculatePartialWidths()
            let remaining = this.domController.bodyWrapperWidth - width.left - width.right - scrollbarWidth

            diff = width.center - remaining

            let autosizableCols: IVirtualGridColumn[] = this.getAutoSizableColumns(centerColumns, diff < 0);
            let diffPerColumn: number = autosizableCols.length > 0 ? diff / autosizableCols.length : 0

            this.adjustCell(autosizableCols, -1 * diffPerColumn);
        }
    };

    public updateGridWidth() {
        let centerColumns = this.Grid.columns.filter(x => x.pinned == "center")
        let isVerticalScrolling: boolean = this.Grid.ColumnController.isVerticalScrolling;
        let scrollbarWidth = isVerticalScrolling ? this.Grid.ColumnController.scrollbarWidth : 0;
        let gridWidth: number = this.domController.bodyWrapperWidth - scrollbarWidth
        let widths = this.domController.calculatePartialWidths()

        const scrollPortWidth = gridWidth - widths.right - widths.left;

        if (widths.center < scrollPortWidth) {
            let scrollDiff = scrollPortWidth - widths.center
            let scrollDiffPerCol = scrollDiff / centerColumns.length

            this.adjustCell(centerColumns, scrollDiffPerCol);
        }

        this.domController.setStyles(this.dom.headerLeft, {"width": `${widths.left}px`})
        this.domController.setStyles(this.dom.bodyLeft, {"width": `${widths.left}px`})
        this.domController.setStyles(this.dom.headerRight, {"width": `${widths.right}px`})
        this.domController.setStyles(this.dom.bodyRight, {"width": `${widths.right}px`})
        this.domController.setStyles(this.dom.headerCenter, {"width": `${widths.center}px`})
        this.domController.setStyles(this.dom.bodyCenter, {"width": `${widths.center}px`})
        this.domController.setStyles(this.dom.bodyCenterScrollPort, {"width": `${scrollPortWidth}px`})
        this.domController.setStyles(this.dom.headerCenterScrollPort, {"width": `${scrollPortWidth}px`})
    }

    /**
     * adjusts the cell width of each cell (including header cells) to the width of the header cell + the calculated difference per column
     * @param {IVirtualGridColumn[]} columns
     * @param {number} diffPerColumn
     */
    public adjustCell(columns: IVirtualGridColumn[], diffPerColumn: number): void {
        this._adjustCellWidth(columns, diffPerColumn)
        this._adjustCellLeft()
    }

    /**
     * sets the width of each cell, either on init or with a diff per column
     * this ensures, that the dom represents the model definition
     * @param columns
     * @param diffPerColumn
     * @private
     */
    private _adjustCellWidth(columns: IVirtualGridColumn[], diffPerColumn: number) {
        for (let currentColumn of columns) {

            if (currentColumn.isVisible && currentColumn.isAutoResize && !currentColumn.isSuppressResize) {
                let width: number = currentColumn.width + diffPerColumn;

                if (width <= currentColumn.minWidth) {
                    width = currentColumn.minWidth;
                    currentColumn.canShrink = false;
                } else {
                    currentColumn.canShrink = true;
                }

                currentColumn.width = width;
            }

            let _width = currentColumn.isVisible ? currentColumn.width : 0

            this.domController.setStyles(currentColumn.dom.cell, {"width": `${Math.floor(_width)}px`})

            for (const row of this.domController.renderedRows) {
                let styles = {}
                let cell = row.cells[currentColumn.currentIndex].cellNode
                styles["width"] = `${Math.floor(_width)}px`

                if (currentColumn.isHierarchyColumn && this.Grid.rows[row.index] != void 0) {
                    styles["padding-left"] = `${this.Grid.rows[row.index].level * 16}px`
                }

                this.domController.setStyles(cell, styles)
            }
        }
    }

    /**
     * sets the left value according to the configuration
     * @private
     */
    private _adjustCellLeft() {

        let left = 0;
        let side = "left"

        for (let i = 0; i < this.Grid.columns.length; i++) {
            let currentColumn = this.Grid.columns[i]

            if (currentColumn.pinned != side) {
                left = 0;
                side = currentColumn.pinned
            }

            currentColumn.left = left;

            if (currentColumn.isVisible) {
                left += currentColumn.width
            }

            this.domController.setStyles(currentColumn.dom.cell, {"transform": `translateX(${Math.floor(currentColumn.left)}px)`})

            for (const row of this.domController.renderedRows) {
                this.domController.setStyles(row.cells[currentColumn.currentIndex].cellNode, {"transform": `translateX(${Math.floor(currentColumn.left)}px)`})
            }
        }
    }

    private bindRowEvents() {
        for (const renderedRow of this.domController.renderedRows) {

            [renderedRow.left, renderedRow.center, renderedRow.right].forEach((partial) => {
                if (this.Grid.ConfigController.useCheckboxSelection) {
                    let checkbox = partial.cells.find(x => x.colModel.isCheckboxColumn)

                    if (checkbox) {
                        checkbox.checkboxNode.addEventListener("click", this.onClick)
                    }
                } else {
                    partial.element.addEventListener("click", this.onClick);
                }

                partial.element.addEventListener("dblclick", this.onDoubleClick);
                partial.element.addEventListener("contextmenu", this.onRightClick);
                partial.element.addEventListener("mouseenter", this.onMouseEnter);
                partial.element.addEventListener("mouseleave", this.onMouseLeave);


                // if (this.Grid.Utils.isPhone()) {
                // listNode.addEventListener("touchstart", this.touchHandler)
                // }
            })

            this.bindCellEvents(renderedRow)
        }
    }

    private bindCellEvents(renderedRow: IRenderedRow) {
        for (let cell of renderedRow.cells) {
            cell.cellNode.addEventListener("mouseenter", (event) => {
                this.onCellMouseEnter(event, cell)
            })
            cell.cellNode.addEventListener("mouseleave", (event) => {
                this.onCellMouseLeave(event, cell)
            })
            cell.cellNode.addEventListener("mousedown", (event) => {
                this.onCellMouseDown(event, cell)
            })
            cell.cellNode.addEventListener("contextmenu", (event) => {
                this.onCellRightClick(event, cell)
            })
        }
    }

    private bindColumnEvents() {
        for (const column of this.Grid.originalColumns) {

            const headerCell: HTMLElement = column.dom.cellTextContainer;
            const filterField: HTMLInputElement = column.dom.cellFilter
            const filterAdvanced: HTMLElement = column.dom.cellFilterAdvancedButton

            headerCell.addEventListener("click", (event: any) => {
                if (!column.isSuppressSort) {
                    this.Grid.ColumnController.sortColumn(column, event.shiftKey)
                }
            })

            headerCell.addEventListener("mousedown", (event) => {
                if (!column.isSuppressDragging) {
                    this.Grid.DnDController.onColDragStart(event, column)
                }
            })

            if (column.isShowFilter) {

                if (column.colType == "boolean") {
                    column.dom.cellFalseFilter.addEventListener("click", () => {
                        this.Grid.FilterController.setBoolFilter(column, false)
                    });

                    column.dom.cellTrueFilter.addEventListener("click", () => {
                        this.Grid.FilterController.setBoolFilter(column, true)
                    })
                } else {
                    filterField.addEventListener("input", () => {
                        this.Grid.FilterController.setTextFilter(column, filterField.value)
                    })

                    filterAdvanced.addEventListener("click", (event) => {
                        this.Grid.FilterController.showAdvancedFilter(event, column)
                    })
                }
            }

            if (!column.isSuppressResize && Number(column.index) < this.Grid.originalColumns.length - 1) {
                column.dom.cellResizer.addEventListener("mousedown", event => this.onResize(column, event))
            }
        }

        // header resizer for left and right pin viewport
        this.dom.headerLeftResizer.addEventListener("mousedown", (event) => {
            let left = this.Grid.columns.filter(x => x.pinned == "left")
            this.onResize(left[left.length - 1], event)
        })

        this.dom.headerRightResizer.addEventListener("mousedown", (event) => {
            let center = this.Grid.columns.filter(x => x.pinned == "center")
            this.onResize(center[center.length - 1], event)
        })
    }

    /**
     * binds relevant events to each row according to the config
     */
    public bindEvents(): void {

        if (!this.Grid.Utils.isPhone()) {
            this.dom.bodyWrapper.addEventListener("scroll", this.onScroll);
        }

        this.dom.scrollYCenterScrollPort.addEventListener("scroll", this.onBodyScrollX)

        this.dom.groupPanel.addEventListener("mouseenter", this.Grid.DnDController.onGroupPanelMouseEnter)
        this.dom.groupPanel.addEventListener("mouseleave", this.Grid.DnDController.onGroupPanelMouseLeave)
        this.dom.groupPanel.addEventListener("mouseup", this.Grid.DnDController.onGroupPanelMouseUp)

        this.bindRowEvents()
        this.bindColumnEvents()
    }

    /**
     * gets the grid Row by the given event and returns it
     * @param event
     * @return {VirtualGridRow}
     */
    public getRowByEvent(event: any): IVirtualGridRow {
        const rowElement: HTMLElement = event.target.closest(".row");
        const index: any = rowElement.getAttribute("number");
        return this.Grid.rows[index];
    }

    /**
     * private helper for scroll event
     * @private
     */
    private _onScroll = (): void => {
        this.domController.recalculateRowOrder();
    }

    /**
     * returns an array of columns that are able to autosize their width
     * when the grid shrinks the columns can only shrink to the minimum column width
     * @param {Array} colsToBeResized - the cols that are being resized
     * @param {boolean} isGrowing - the indicator whether the grid is growing or not
     * @returns {Array} - an array
     */
    private getAutoSizableColumns(colsToBeResized: IVirtualGridColumn[], isGrowing: boolean): IVirtualGridColumn[] {
        return colsToBeResized.filter((col) => col.isVisible && col.pinned === "center" && ((!isGrowing && col.isAutoResize && col.canShrink) || (isGrowing && col.isAutoResize)))
    }
}
