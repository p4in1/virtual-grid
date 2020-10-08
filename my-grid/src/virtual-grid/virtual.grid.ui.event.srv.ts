import {IVirtualGrid, IVirtualGridColumn, IVirtualGridDom, IVirtualGridRow} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridUIDomController} from "./virtual.grid.ui.dom.srv";

export class VirtualGridUIEventController {

    readonly onRowRightClick: any;
    readonly onRowMouseEnter: any;
    readonly onRowDoubleClick: any;
    readonly onRowClick: any;
    readonly onSwipeStart: any;

    private dom: IVirtualGridDom;

    private gPadding: number = 16;

    private globalResizeObserver;

    scrollLeft: number = 0

    constructor(private Grid: IVirtualGrid, private config: any, private domController: VirtualGridUIDomController) {
        this.dom = domController.dom;
        // callbacks
        this.onRowRightClick = this.config.onRowRightClick;
        this.onRowDoubleClick = this.config.onRowDoubleClick;
        this.onRowMouseEnter = this.config.onRowMouseEnter;
        this.onRowClick = this.config.onRowClick;
        this.onSwipeStart = this.config.onSwipeStart;
    }

    /**
     * onClick callback
     * @param event - the click event
     */
    private onClick = (event: any): void => {
        const row: IVirtualGridRow = this.getRowByEvent(event);

        if (!row.isSelectable) {
            return;
        }

        const isCheckboxSelection: boolean = event.target.classList.contains("tree-checkbox-icon");
        const useCtrl: boolean = event.ctrlKey,
            useShift: boolean = event.shiftKey;

        this.Grid.api.select(row, useCtrl, useShift, isCheckboxSelection);

        if (this.onRowClick != void 0) {
            this.onRowClick({row, event, api: this.Grid.api});
        }
    };

    /**
     * onDoubleClick callback
     * @param event - the click event
     */
    private onDoubleClick = (event: any): void => {
        const row: IVirtualGridRow = this.getRowByEvent(event);

        if (!row.isSelectable) {
            return;
        }

        this.Grid.api.select(row);

        if (this.onRowDoubleClick != void 0) {
            this.onRowDoubleClick({row, event, api: this.Grid.api});
        }
    };

    /**
     * onRightClick callback
     * @param event - the click event
     */
    private onRightClick = (event: any): void => {
        const row: IVirtualGridRow = this.getRowByEvent(event);

        if (!row || !row.isSelectable) {
            return;
        }

        if (this.onRowRightClick != void 0) {
            this.onRowRightClick({row, event, api: this.Grid.api});
        }

        event.preventDefault();
    };

    /**
     * onRightClick callback
     * @param event - the click event
     */
    private onMouseEnter = (event: any): void => {
        const row: IVirtualGridRow = this.getRowByEvent(event);

        if (!row || !row.isSelectable) {
            return;
        }

        if (this.onRowMouseEnter != void 0) {
            this.onRowMouseEnter({row, event, api: this.Grid.api});
        }

        event.preventDefault();
    };

    /**
     * catch the scroll event of the scroll guard and apply it to the body and the header
     */
    private onBodyScrollX = (): void => {
        this.scrollLeft = this.dom.scrollYCenterScrollport.scrollLeft

        this.dom.bodyCenterScrollPort.scrollLeft = this.scrollLeft
        this.dom.headerCenterScrollPort.scrollLeft = this.scrollLeft

        this.domController.setShadow()
    }

    /**
     * on scroll callback
     */
    private onScroll = (): void => {
        if (this.domController.showHeader) {
            this.dom.headerWrapper.scrollLeft = this.dom.bodyWrapper.scrollLeft;
        }

        this._onScroll()
    };

    /**
     * the resize event of the header resize handle
     * @param {IVirtualGridColumn} col
     * @param {Object} event
     */
    private onResize = (col: IVirtualGridColumn, event): void => {

        let currentX: number = event.screenX;

        const _resize = (event: any): void => {

            requestAnimationFrame(() => {

                let diff: number = -(currentX - event.screenX);

                if (diff == 0) {
                    return;
                }

                currentX += diff

                console.log(col.currentIndex)

                this.updateCellWidth(col.currentIndex, diff)
                this.updateGridWidth()
                this.domController.calculateScrollGuard()
            })
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
     * calculates and updates the columnwidths of all columns starting from the startindex
     * at this point we calculate the relative width of a column once something changed according to the configuration
     * off all columns whether they can grow or shrink
     * the calculation starts periodically every 16ms caused by the use of a requestAnimationFrame
     * @param {number} start - the index to start calculating from
     * @param {number} diff - the difference in width for the given column from the start parameter
     */
    private updateCellWidth: (start?: number, diff?: number) => void = (start?: number, diff?: number): void => {

        let startColumn = this.Grid.columns[start];
        let nextColumn = this.Grid.columns[start + 1]

        let isLeftPinResizing = start != void 0 && startColumn.pinned === "left"
        let isRightPinResizing = start != void 0 && nextColumn.pinned === "right"

        let autosizableCols: IVirtualGridColumn[];
        let diffPerColumn: number

        if (diff < 0 && startColumn.width + diff <= startColumn.minWidth && !isRightPinResizing) {
            diff = 0
        }

        let centerColumns = this.Grid.columns.filter(x => x.pinned == "center")

        if (start != void 0) {
            let startCol = isRightPinResizing ? [nextColumn] : [startColumn]
            let startDiff = isRightPinResizing ? -1 * diff : diff
            let colDiff = isRightPinResizing ? diff : -1 * diff
            let isGrowing = isRightPinResizing ? diff > 0 : diff < 0

            let columns = isRightPinResizing || isLeftPinResizing ? centerColumns : centerColumns.filter(x => x.currentIndex > start)

            this.adjustCell(startCol, startDiff);

            if (!this.domController.isHorizontalScrolling) {

                autosizableCols = this.getAutoSizableColumns(columns, isGrowing);
                diffPerColumn = autosizableCols.length > 0 ? colDiff / autosizableCols.length : 0

                this.adjustCell(autosizableCols, diffPerColumn);
            }

        } else {
            let isVertivalScrolling: boolean = this.Grid.ColumnController.isVerticalScrolling;
            let scrollbarWidth = isVertivalScrolling ? this.Grid.ColumnController.scrollbarWidth : 0;
            let width = this.domController.calculatePartialWidths()
            let remaining = this.domController.bodyWrapperWidth - width.bodyLeftWidth - width.bodyRightWidth - scrollbarWidth

            diff = width.bodyCenterWidth - remaining
            autosizableCols = this.getAutoSizableColumns(centerColumns, diff < 0);
            diffPerColumn = autosizableCols.length > 0 ? diff / autosizableCols.length : 0

            this.adjustCell(autosizableCols, -1 * diffPerColumn);
        }
    };

    public updateGridWidth() {
        let centerColumns = this.Grid.columns.filter(x => x.pinned == "center")
        let isVertivalScrolling: boolean = this.Grid.ColumnController.isVerticalScrolling;
        let scrollbarWidth = isVertivalScrolling ? this.Grid.ColumnController.scrollbarWidth : 0;
        let gridWidth: number = this.domController.bodyWrapperWidth - scrollbarWidth
        let widths = this.domController.calculatePartialWidths()

        const scrollPortWidth = gridWidth - widths.bodyRightWidth - widths.bodyLeftWidth;

        if (widths.bodyCenterWidth < scrollPortWidth) {
            let scrollDiff = scrollPortWidth - widths.bodyCenterWidth
            let scrollDiffPerCol = scrollDiff / centerColumns.length

            this.adjustCell(centerColumns, scrollDiffPerCol);
        }

        this.domController.setStyles(this.dom.headerLeft, {"width": `${widths.bodyLeftWidth}px`})
        this.domController.setStyles(this.dom.bodyLeft, {"width": `${widths.bodyLeftWidth}px`})
        this.domController.setStyles(this.dom.headerRight, {"width": `${widths.bodyRightWidth}px`})
        this.domController.setStyles(this.dom.bodyRight, {"width": `${widths.bodyRightWidth}px`})
        this.domController.setStyles(this.dom.headerCenter, {"width": `${widths.bodyCenterWidth}px`})
        this.domController.setStyles(this.dom.bodyCenter, {"width": `${widths.bodyCenterWidth}px`})
        this.domController.setStyles(this.dom.bodyCenterScrollPort, {"width": `${scrollPortWidth}px`})
        this.domController.setStyles(this.dom.headerCenterScrollPort, {"width": `${scrollPortWidth}px`})
    }

    /**
     * adjusts the cellwidth of each cell (including header cells) to the width of the header cell + the calculated difference per column
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

            let width: number;

            if (currentColumn.isAutoResize && !currentColumn.isSuppressResize) {
                width = currentColumn.width + diffPerColumn;

                if (width <= currentColumn.minWidth) {
                    width = currentColumn.minWidth;
                    currentColumn.canShrink = false;
                } else {
                    currentColumn.canShrink = true;
                }

                currentColumn.width = width;
            }

            this.domController.setStyles(currentColumn.dom.cell, {"width": `${Math.floor(currentColumn.width)}px`})

            for (const row of this.domController.renderedRows) {
                let styles = {}
                let cell = row.cells[currentColumn.currentIndex].cellNode
                styles["width"] = `${Math.floor(currentColumn.width)}px`

                if (currentColumn.isShowAsTree) {
                    styles["padding-left"] = `${this.Grid.rows[row.index].level * this.gPadding}px`
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

            left += currentColumn.width

            this.domController.setStyles(currentColumn.dom.cell, {"transform": `translateX(${Math.floor(currentColumn.left)}px)`})

            for (const row of this.domController.renderedRows) {
                this.domController.setStyles(row.cells[currentColumn.currentIndex].cellNode, {"transform": `translateX(${Math.floor(currentColumn.left)}px)`})
            }
        }
    }

    /**
     * the touch handler for the swipe events
     * @param event
     */
    // private touchHandler = (event: any): void => {
    //
    //     this.resetSwipeActionElement(event);
    //
    //     this.swipedElement = event.currentTarget;
    //
    //     let rowIndex = Number(this.swipedElement.closest(".virtual-grid-row").getAttribute("number"));
    //     let isHorizontallyScrolling = false;
    //     let movement = 0;
    //     let isActionSet = false;
    //     let swipeActions: any = {};
    //
    //     const row: any = this.Grid.api.getRowByIndex(rowIndex);
    //
    //     if (typeof (this.onSwipeStart) == "function") {
    //         this.onSwipeStart(row)
    //     }
    //
    //     if (typeof (this.swipeConfig.swipeActionGetter) == "function") {
    //         swipeActions = this.swipeConfig.swipeActionGetter(this.Grid.api, rowIndex)
    //     } else {
    //         swipeActions = {
    //             resolve: this.swipeConfig.onSwipeResolveActions,
    //             reject: this.swipeConfig.onSwipeRejectActions,
    //         }
    //     }
    //
    //     this.dom.swipeActionElement.css({
    //         width: 0,
    //         position: "absolute",
    //         top: row.index * this.Grid.RowController.rowHeight,
    //         height: this.Grid.RowController.rowHeight,
    //         display: "flex",
    //         "flex-direction": "row"
    //     });
    //
    //     let touchEvent = event.originalEvent.touches[0];
    //     let start = touchEvent.clientX;
    //
    //     this.dom.bodyWrapper.on("scroll", (event) => {
    //         if (this.Grid.UI.domController.showHeader) {
    //             this.dom.headerWrapper.scrollLeft(this.dom.bodyWrapper.scrollLeft() as number);
    //         }
    //
    //         // this.swipedElement.off("touchmove touchend");
    //         $(window).off("click");
    //         this.resetSwipeActionElement();
    //         this._onScroll();
    //     });
    //
    //     this.swipedElement.addEventListener("touchmove", (moveEvent: any) => {
    //         let moveTouch = moveEvent.originalEvent.touches[0];
    //         let newMovement = moveTouch.clientX - start;
    //
    //         if (isActionSet && (movement < 0 && newMovement >= 0) || (movement > 0 && newMovement <= 0)) {
    //             isActionSet = false;
    //         }
    //
    //         movement = moveTouch.clientX - start;
    //
    //         if (Math.abs(movement) < 15 && !isHorizontallyScrolling) {
    //             return;
    //         }
    //
    //         if (!isHorizontallyScrolling) {
    //             movement = 0;
    //             isHorizontallyScrolling = true;
    //             isActionSet = false;
    //             this.isSwipeActionVisible = true;
    //         }
    //
    //         if (!isActionSet && movement != 0) {
    //
    //             isActionSet = true;
    //             this.dom.swipeActionElement.empty();
    //
    //             let _swipeActions = movement > 0 ? swipeActions.resolve : swipeActions.reject;
    //
    //             this.addSwipeActions(this.dom.swipeActionElement, _swipeActions, rowIndex)
    //         }
    //
    //         if (movement < 0) {
    //             this.dom.swipeActionElement.css({width: Math.abs(movement), right: 0, left: "auto"});
    //         } else if (movement > 0) {
    //             this.dom.swipeActionElement.css({width: movement, left: 0, right: "auto"});
    //         }
    //
    //         this.swipedElement.style["left"] = `${movement}px`
    //     });
    //
    //     this.swipedElement.addEventListener("touchend", () => {
    //         // this.swipedElement.off("touchmove touchend");
    //
    //         if (Math.abs(movement) >= this.dom.bodyWrapper.width() / 2) {
    //             if (movement < 0 && swipeActions.reject.length == 1) {
    //                 swipeActions.reject[0].callback(row);
    //                 this.resetSwipeActionElement()
    //             } else if (movement > 0 && swipeActions.resolve.length == 1) {
    //                 swipeActions.resolve[0].callback(row);
    //                 this.resetSwipeActionElement()
    //             }
    //
    //             $(window).off("click")
    //         }
    //
    //         if (Math.abs(movement) < this.dom.bodyWrapper.width() / 4) {
    //             this.resetSwipeActionElement()
    //         }
    //     });
    //
    //     $(window).on("click", (event) => {
    //         this.resetSwipeActionElement(event);
    //         $(window).off("click")
    //     });
    // };
    /**
     * resets the action element to its original position and hides it
     */
    // private resetSwipeActionElement = (event?): void => {
    //     if (this.swipedElement) {
    //         this.swipedElement.style["left"] = "0px";
    //     }
    //
    //     this.dom.swipeActionElement && this.dom.swipeActionElement.css({width: 0});
    //
    //     if (this.isSwipeActionVisible && event) {
    //         event.stopImmediatePropagation();
    //         event.stopPropagation();
    //         event.preventDefault();
    //     }
    //
    //     this.isSwipeActionVisible = false;
    // };

    private bindRowEvents() {
        for (const renderedRow of this.domController.renderedRows) {

            [renderedRow.left.element, renderedRow.center.element, renderedRow.right.element].forEach((listNode) => {
                if (typeof (this.onRowClick) == "function") {
                    listNode.addEventListener("click", this.onClick);
                }

                if (typeof (this.onRowDoubleClick) == "function") {
                    listNode.addEventListener("dblclick", this.onDoubleClick);
                }

                if (typeof (this.onRowRightClick) == "function") {
                    listNode.addEventListener("contextmenu", this.onRightClick);
                }

                if (typeof (this.onRowMouseEnter) == "function") {
                    listNode.addEventListener("mouseenter", this.onMouseEnter);
                }

                if (this.Grid.Utils.isPhone()) {
                    // listNode.addEventListener("touchstart", this.touchHandler)
                }
            })
        }
    }

    private bindColumnEvents() {
        for (const column of this.Grid.originalColumns) {

            const headerCell: HTMLElement = column.dom.cellTextContainer;
            const filterField: HTMLInputElement = column.dom.cellFilter


            if (!column.isSuppressSort) {
                headerCell.addEventListener("click", (event: any) => {
                    this.Grid.ColumnController.sortColumn(column, event.shiftKey)
                })
            }

            if (!column.isSuppressDragging) {
                headerCell.addEventListener("mousedown", (event) => {
                    this.Grid.DnDController.onColDragStart(event, column)
                })
            }

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

        this.dom.scrollYCenterScrollport.addEventListener("scroll", this.onBodyScrollX)

        this.bindRowEvents()
        this.bindColumnEvents()
    }

    /**
     * gets the grid Row by the given event and returns it
     * @param event
     * @return {VirtualGridRow}
     */
    protected getRowByEvent(event: any): IVirtualGridRow {
        const rowElement: HTMLElement = event.target.closest(".virtual-grid-row");
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
     * when the grid shrinks the columns can only shrink to the minimum columnwidth
     * @param {Array} colsToBeResized - the cols that are being resized
     * @param {boolean} isGrowing - the indicator whether the grid is growing or not
     * @returns {Array} - an array
     */
    private getAutoSizableColumns(colsToBeResized: IVirtualGridColumn[], isGrowing: boolean): IVirtualGridColumn[] {
        return colsToBeResized.filter((col) => col.pinned === "center" && ((!isGrowing && col.isAutoResize && col.canShrink) || (isGrowing && col.isAutoResize)))
    }

    /**
     * adds swipe actions to the action container
     * @param actionElement - the action element where the swipe actions are stored and shown
     * @param actions - the action models
     * @param rowIndex - the rowIndex where the actionelement should show up
     */
    // private addSwipeActions(actionElement, actions, rowIndex) {
    //     for (const action of actions) {
    //         let element = $("<div></div>");
    //
    //         if (!action.icon) {
    //             element.append($(`<span>${action.title}</span>`));
    //             element.css(
    //                 {
    //                     "background-color": action.backgroundColor,
    //                     "width": "100%",
    //                     "display": "flex",
    //                     "align-items": "center",
    //                     "font-size": "16px",
    //                     "overflow": "hidden",
    //                     "justify-content": "center",
    //                     "white-space": "nowrap",
    //                     "text-overflow": "ellipsis",
    //                 });
    //         } else {
    //             element.addClass(action.icon);
    //             element.css(
    //                 {
    //                     "background-color": action.backgroundColor,
    //                     "background-repeat": "no-repeat",
    //                     "background-size": "24px 24px",
    //                     "background-position": "center",
    //                     width: "100%"
    //                 });
    //         }
    //
    //
    //         element.on("click", (event) => {
    //             action.callback(this.Grid.api.getRowByIndex(rowIndex));
    //             event.stopImmediatePropagation();
    //             event.stopPropagation();
    //             this.resetSwipeActionElement()
    //         });
    //
    //         actionElement.append(element)
    //     }
    // }
}
