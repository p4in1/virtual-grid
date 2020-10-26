import {VirtualGridUtils} from "./virtual.grid.utils";
import {
    IRenderedCell,
    IRenderedRow,
    IRenderedRowPartial,
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridDom,
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";


export class VirtualGridUIDomController {
    dom: IVirtualGridDom
    Utils: VirtualGridUtils;

    rowHeight: number = 24;
    headerRowHeight: number = 24;
    renderedRows: IRenderedRow[] = [];

    renderedRowCount: number = 40;
    renderedColumns: IVirtualGridColumn[] = [];

    renderedColumnCount: number = -1;

    bodyWrapperHeight: number = 0;
    bodyWrapperWidth: number = 0;
    gridHeight: number = 0
    bodyHeight: number = 0

    visibleRowIndices: number[] = [];

    isHorizontalScrolling: boolean = false;

    lastTop: number = 0;

    scrollPortWidth: number

    styleCommands = [];

    constructor(private Grid: IVirtualGrid, private config: VirtualGridConfigController) {

        this.lastTop = 0;
        this.Utils = this.Grid.Utils
        this.headerRowHeight = this.config.headerRowHeight;
        this.rowHeight = this.config.rowHeight

        this.renderedColumnCount = this.config.colDefs.length;

        this.dom = {

            virtualGrid: this.Utils.el("div", ['virtual-grid']),

            headerWrapper: this.Utils.el("div", ['header-wrapper']),
            headerCenterScrollPort: this.Utils.el("div", ['header-wrapper-scroll-port']),

            bodyWrapper: this.Utils.el("div", ['body-wrapper']),
            bodyCenterScrollPort: this.Utils.el("div", ['body-wrapper-scroll-port']),

            bodyCenter: this.Utils.el("div", ['body-center']),
            bodyLeft: this.Utils.el("div", ['body-left']),
            bodyRight: this.Utils.el("div", ['body-right']),

            headerCenter: this.Utils.el("div", ['header-center']),
            headerLeft: this.Utils.el("div", ['header-left']),
            headerRight: this.Utils.el("div", ['header-right']),

            headerLeftResizer: this.Utils.el("div", ['header-left-resizer']),
            headerRightResizer: this.Utils.el("div", ['header-right-resizer']),

            gridContainer: this.config.element,
            swipeActionElement: this.Utils.el("div"),

            scrollYGuard: this.Utils.el("div", ['scroll-y-guard']),
            scrollYLeftSpacer: this.Utils.el("div", ['scroll-y-left-spacer']),
            scrollYRightSpacer: this.Utils.el("div", ['scroll-y-right-spacer']),
            scrollYCenterSpacer: this.Utils.el("div", ['scroll-y-center-spacer']),
            scrollYCenterScrollPort: this.Utils.el("div", ['scroll-y-center-scroll-port']),

            ghost: this.Utils.el("div", ["virtual-grid-ghost"]),
            ghostLabel: this.Utils.el("span", ["ghost-label"]),

            groupPanel: this.Utils.el("div", ["group-panel"]),
            groupPanelPlaceholder: this.Utils.el("span", ["group-panel-placeholder"]),
            groupPanelContent: this.Utils.el("div", ["group-panel-content"]),

            contextmenu: this.Utils.el("div", ["virtual-grid-context-menu"]),
            contextmenuBackdrop: this.Utils.el("div", ["virtual-grid-context-menu-backdrop"]),
        };

        // add the grid to the given dom node
        this.dom.gridContainer.append(this.dom.virtualGrid)
        // add the main parts of the grid
        this.dom.virtualGrid.append(this.dom.groupPanel, this.dom.headerWrapper, this.dom.bodyWrapper, this.dom.scrollYGuard)

        this.dom.groupPanel.append(this.dom.groupPanelPlaceholder, this.dom.groupPanelContent)

        this.dom.headerLeft.append(this.dom.headerLeftResizer)
        this.dom.headerRight.append(this.dom.headerRightResizer)

        this.dom.scrollYCenterScrollPort.append(this.dom.scrollYCenterSpacer)

        this.dom.scrollYGuard.append(this.dom.scrollYLeftSpacer, this.dom.scrollYCenterScrollPort, this.dom.scrollYRightSpacer)

        this.dom.headerCenterScrollPort.append(this.dom.headerCenter)

        this.dom.headerWrapper.append(this.dom.headerLeft, this.dom.headerCenterScrollPort, this.dom.headerRight);

        this.dom.bodyCenterScrollPort.append(this.dom.bodyCenter)

        this.dom.bodyWrapper.append(this.dom.bodyLeft, this.dom.bodyCenterScrollPort, this.dom.bodyRight);

        this.dom.ghost.append(this.dom.ghostLabel)

        this.setGridDefaults()
        this.styleUpdater()
    }

    setGridDefaults() {
        if (this.Grid.ConfigController.selectionMethod == "range") {
            this.dom.virtualGrid.classList.add("range-selection")
        } else {
            this.dom.virtualGrid.classList.add("default-selection")
        }

        this.dom.groupPanelPlaceholder.textContent = "Drag and drop columns here to group"
    }

    setStyles(element, styles) {
        let command = {e: element, styles: []}

        for (let key in styles) {
            let item = {}
            item[key] = styles[key]
            command.styles.push(item)
        }

        this.styleCommands.push(command)
    }

    styleUpdater() {
        requestAnimationFrame(() => {

            if (this.styleCommands.length > 0) {

                for (let command of this.styleCommands) {

                    for (let s of command.styles) {
                        let key = Object.keys(s)[0]
                        command.e.style[key] = s[key]
                    }
                }

                this.styleCommands = []
            }

            this.styleUpdater()
        })
    }

    /**
     * calculates the height of the grid according to the amount of visible rows up to a maximum of around 12 rows in height
     */
    public calculateGridHeight = (): void => {

        let gridHeight = `${this.config.rowHeight * this.visibleRowIndices.length}px`

        this.dom.bodyCenterScrollPort.style["height"] = gridHeight;

        this.dom.bodyLeft.style["height"] = gridHeight;
        this.dom.bodyCenter.style["height"] = gridHeight;
        this.dom.bodyRight.style["height"] = gridHeight;
    };

    reorderRenderedRows() {
        this.renderedRows.sort((a, b) => {

            if (a.index == -1 || b.index == -1) {
                return 1
            }

            return a.index > b.index ? 1 : -1
        })
    }

    /**
     * reset each rendered row to the initial position and index
     */
    public resetRenderedRows = (): void => {
        for (let i: number = 0; i < this.renderedRowCount; i++) {
            const row: IRenderedRow = this.renderedRows[i];

            row.index = i;
            row.top = i * this.config.rowHeight;

            row.left.element.style["transform"] = `translateY(${row.top}px)`;
            row.center.element.style["transform"] = `translateY(${row.top}px)`;
            row.right.element.style["transform"] = `translateY(${row.top}px)`;
        }
    };

    public createGrid(): void {
        let headerLeftFragment = document.createDocumentFragment();
        let headerCenterFragment = document.createDocumentFragment();
        let headerRightFragment = document.createDocumentFragment();

        let bodyLeftFragment = document.createDocumentFragment();
        let bodyCenterFragment = document.createDocumentFragment();
        let bodyRightFragment = document.createDocumentFragment();

        if (this.config.showHeader) {
            this.dom.headerLeft.style["height"] = `${this.headerRowHeight}px`;
            this.dom.headerCenter.style["height"] = `${this.headerRowHeight}px`;
            this.dom.headerRight.style["height"] = `${this.headerRowHeight}px`;

            this.dom.headerWrapper.style["height"] = `${this.headerRowHeight}px`;
        } else {
            this.dom.headerWrapper.classList.add("hidden")
        }

        if (!this.config.showGroupPanel) {
            this.dom.groupPanel.classList.add("hidden")
        }

        for (let i: number = 0; i < this.renderedColumnCount; i++) {
            let column = this.Grid.originalColumns[i]

            if (column.pinned === "left") {
                headerLeftFragment.append(this.createColumn(i))
            }

            if (column.pinned === "center") {
                headerCenterFragment.append(this.createColumn(i))
            }

            if (column.pinned === "right") {
                headerRightFragment.append(this.createColumn(i))
            }

        }

        for (let i: number = 0; i < this.renderedRowCount; i++) {

            const renderedRow: IRenderedRow = {
                index: i,
                isVisible: true,
                top: 0,
                cells: [],
                left: {
                    cells: [],
                    element: this.Utils.el("div", ["row"])
                },
                center: {
                    cells: [],
                    element: this.Utils.el("div", ["row"])
                },
                right: {
                    cells: [],
                    element: this.Utils.el("div", ["row"])
                },
            };

            bodyLeftFragment.append(this.createRow(renderedRow.left, this.Grid.columns.filter(x => x.pinned == "left")));
            bodyCenterFragment.append(this.createRow(renderedRow.center, this.Grid.columns.filter(x => x.pinned == "center")));
            bodyRightFragment.append(this.createRow(renderedRow.right, this.Grid.columns.filter(x => x.pinned == "right")));

            renderedRow.cells = renderedRow.left.cells.concat(renderedRow.center.cells).concat(renderedRow.right.cells)

            this.renderedRows.push(renderedRow);
        }

        this.dom.headerLeft.append(headerLeftFragment);
        this.dom.headerCenter.append(headerCenterFragment);
        this.dom.headerRight.append(headerRightFragment);

        this.dom.bodyLeft.append(bodyLeftFragment);
        this.dom.bodyCenter.append(bodyCenterFragment);
        this.dom.bodyRight.append(bodyRightFragment);

        if (this.Grid.columns.filter(x => x.pinned == "left").length === 0) {
            this.dom.headerLeft.classList.add("hidden")
            this.dom.bodyLeft.classList.add("hidden")
        }

        if (this.Grid.columns.filter(x => x.pinned == "right").length === 0) {
            this.dom.headerRight.classList.add("hidden")
            this.dom.bodyRight.classList.add("hidden")
        }
    }

    public calculateWrapper() {
        this.gridHeight = this.dom.virtualGrid.offsetHeight

        this.bodyHeight = this.dom.bodyCenter.offsetHeight

        this.bodyWrapperHeight = this.dom.bodyWrapper.offsetHeight
        this.bodyWrapperWidth = this.dom.bodyWrapper.offsetWidth
    }

    public calculateScrollGuard() {
        let widths = this.calculatePartialWidths()

        let isVerticalScrolling: boolean = this.Grid.ColumnController.isVerticalScrolling;
        let scrollbarWidth = isVerticalScrolling ? this.Grid.ColumnController.scrollbarWidth : 0;
        let scrollPortWidth = this.bodyWrapperWidth - (widths.right + widths.left + scrollbarWidth)
        let scrollPortTolerance = 8;

        this.setStyles(this.dom.scrollYLeftSpacer, {"width": `${widths.left}px`})
        this.setStyles(this.dom.scrollYCenterScrollPort, {"width": `${scrollPortWidth}px`})
        this.setStyles(this.dom.scrollYRightSpacer, {"width": `${widths.right}px`})
        this.setStyles(this.dom.scrollYCenterSpacer, {"width": `${widths.center}px`})

        // we use a tolerance to not show the scrollbar in case it it less than 4 pixel bigger
        // this ensures that calculation do not trigger the scrollbar to show when we are off by a few pixel
        if (widths.center - scrollPortTolerance > scrollPortWidth) {
            this.isHorizontalScrolling = true;
            this.setStyles(this.dom.scrollYGuard, {"height": "8px", "min-height": "8px", "max-height": "8px"})
        } else {
            this.isHorizontalScrolling = false;
            this.setStyles(this.dom.scrollYGuard, {"height": "0px", "min-height": "0px", "max-height": "0px"})
        }

        this.scrollPortWidth = scrollPortWidth

        this.setShadow()
    }

    public setShadow() {
        let scrollLeft = this.Grid.eventController.scrollLeft
        let scrollPortWidth = this.scrollPortWidth
        let width = this.calculatePartialWidths()
        let isScrolledToTheRight = scrollLeft + scrollPortWidth == Math.round(width.center)
        let bodyLeft = this.dom.bodyLeft
        let bodyRight = this.dom.bodyRight
        let headerLeft = this.dom.headerLeft
        let headerRight = this.dom.headerRight

        if (this.isHorizontalScrolling) {
            this.Utils.toggleClass("shadow", bodyRight, !isScrolledToTheRight)
            this.Utils.toggleClass("shadow", headerRight, !isScrolledToTheRight)

            this.Utils.toggleClass("shadow", bodyLeft, scrollLeft > 0)
            this.Utils.toggleClass("shadow", headerLeft, scrollLeft > 0)

        } else {
            bodyRight.classList.remove("shadow")
            headerRight.classList.remove("shadow")
            bodyLeft.classList.remove("shadow")
            headerLeft.classList.remove("shadow")
        }
    }

    public calculatePartialWidths() {
        let left = 0
        let center = 0
        let right = 0

        for (const col of this.Grid.originalColumns) {

            if (col.width == void 0 || !col.isVisible) {
                continue
            }

            if (col.pinned === "left") {
                left += col.width
            }

            if (col.pinned === "center") {
                center += col.width
            }

            if (col.pinned === "right") {
                right += col.width
            }
        }

        return {left, center, right}
    }

    /**
     * creates the header for the configured columns
     * appends nodes to the header element
     */
    private createColumn(index: number): HTMLElement {
        let column: IVirtualGridColumn = this.Grid.originalColumns[index];
        let nextColumn: IVirtualGridColumn = this.Grid.originalColumns[index + 1];

        let dom = column.dom;
        let cell = dom.cell = this.Utils.el("div", ["header-cell"]);

        dom.cellText = this.Utils.el("span", ["header-cell-text"]);
        dom.cellText.textContent = column.title;

        dom.cellSortArrow = this.Utils.el("i", ["header-sort-arrow", "virtual-material-icons", "small"]);
        dom.cellSortArrow.innerHTML = "trending_flat"

        dom.cellResizer = this.Utils.el("div", ["header-cell-resizer"]);
        dom.cellFilter = this.Utils.el("input", ["header-filter-input"]) as HTMLInputElement
        dom.cellFilterAdvancedButton = this.Utils.el("i", ["header-filter-advanced-button", "virtual-material-icons", "small"])

        dom.cellTrueFilter = this.Utils.el("div", ["header-filter-bool-button"]) as HTMLDivElement
        dom.cellFalseFilter = this.Utils.el("div", ["header-filter-bool-button"]) as HTMLDivElement

        dom.cellContent = this.Utils.el("div", ["header-cell-content"])
        dom.cellTextContainer = this.Utils.el("div", ["header-cell-text-container"])
        dom.cellFilterContainer = this.Utils.el("div", ["header-cell-filter-container"])

        dom.cellTextContainer.append(dom.cellText, dom.cellSortArrow);

        let trueFilterIcon = this.Utils.el("i", ["filter-button", "virtual-material-icons"])
        let falseFilterIcon = this.Utils.el("i", ["filter-button", "virtual-material-icons"])

        trueFilterIcon.innerHTML = "done"
        falseFilterIcon.innerHTML = "clear"

        dom.cellTrueFilter.append(trueFilterIcon)
        dom.cellFalseFilter.append(falseFilterIcon)

        cell.append(dom.cellContent)

        dom.cellContent.append(dom.cellTextContainer)

        if (column.isShowFilter) {
            if (column.colType === "boolean") {
                dom.cellFilterContainer.append(dom.cellTrueFilter, dom.cellFalseFilter)
                dom.cellFilterContainer.classList.add("bool-filter-container")
            } else {
                dom.cellFilterContainer.append(dom.cellFilter, dom.cellFilterAdvancedButton)

                dom.cellFilterAdvancedButton.textContent = "filter_list"
            }

            dom.cellContent.append(dom.cellFilterContainer)
        }

        if (!column.isSuppressResize && nextColumn && column.pinned == nextColumn.pinned) {
            dom.cell.append(column.dom.cellResizer);
        }

        if (column.width > column.minWidth) {
            column.canShrink = true;
        }

        this.renderedColumns.push(column);

        return cell
    }

    private createRow(row, columns: IVirtualGridColumn[]): HTMLElement {

        this.createCells(row, columns);

        row.element.style["height"] = `${this.config.rowHeight}px`;
        row.element.style["transform"] = `translateY(${row.top}px)`;
        row.element.style["display"] = "flex";

        return row.element
    }

    private createCells(row: IRenderedRowPartial, columns: IVirtualGridColumn[]): void {

        for (const col of columns) {

            const cell: IRenderedCell = <IRenderedCell>{
                textNodes: [],
                treeNode: null,
                checkboxNode: null,
                avatarNode: null,
                avatarPlaceholder: null,
                cellNode: this.Utils.el("div", ["cell"]),
                cellContentNode: this.Utils.el("div", ["cell-content"]),
                colId: col.id,
                colModel: col,
                field: col.field,
                fieldPath: col.fieldPath,
                cellRenderer: col.cellRenderer,
                cellValueGetter: col.cellValueGetter,
                cellStyleGetter: col.cellStyleGetter
            };

            if (col.isHierarchyColumn || col.isRowGroupColumn) {
                cell.treeNode = this.Utils.el("i", ["node-icon", "virtual-material-icons", "small"]);
                cell.treeNode.addEventListener("click", this.Grid.RowController.toggleNodeListener);
                cell.cellNode.append(cell.treeNode)
            }

            if (this.config.useCheckboxSelection && col.isCheckboxColumn) {
                cell.checkboxNode = this.Utils.el("div", ["checkbox"])
                cell.checkboxIcon = this.Utils.el("i", ["checkbox-icon", "virtual-material-icons", "small"]);
                cell.cellNode.classList.add("checkbox-node")
                cell.cellNode.append(cell.checkboxNode)
                cell.checkboxNode.append(cell.checkboxIcon)

            } else if (col.isAvatarColumn) {

                cell.avatarNode = this.Utils.el("div", ["avatar-icon"]);
                cell.avatarPlaceholder = this.Utils.el("span", ["avatar-placeholder"]);

                cell.avatarNode.append(cell.avatarPlaceholder)

                cell.cellNode.classList.add("avatar-node")
                cell.cellNode.append(cell.avatarNode)
            } else if (col.isActionColumn) {

                cell.cellNode.classList.add("action-node")

                for (let action of col.actions) {
                    let actionTag = this.Utils.el("i", ["action-icon", "virtual-material-icons"]);
                    actionTag.innerHTML = action.icon
                    actionTag.style.color = action.color

                    actionTag.addEventListener("click", (e) => {
                        this.Grid.RowController.executeAction(e, action)
                    });

                    cell.cellNode.append(actionTag);
                }

            } else {

                if (col.colType == "boolean") {
                    cell.cellNode.classList.add("boolean-node")
                } else {
                    cell.cellNode.classList.add("text-node")
                }

                for (let i = 0; i < col.lineCount; i++) {
                    let textNode = this.Utils.el("span", ["cell-text"]);
                    cell.textNodes.push(textNode)
                    cell.cellContentNode.append(textNode);
                }

                cell.cellNode.append(cell.cellContentNode)
            }

            row.cells.push(cell);
            row.element.append(cell.cellNode);
        }
    }

    public recalculateRowOrder(scrollTopOverride?: number): void {
        requestAnimationFrame(() => {
            this.rearrangeListNodes(scrollTopOverride);
        })
    }

    /**
     * Alter the order of the rendered rows when the user scrolls
     * using only the visible area to avoid giant dom nodes
     * this would impact the responsiveness of the whole browser
     *
     * at this point once the user scrolls, some rows will be scrolled outside the visible area,
     * we use these containers and adjust their top position and shift them through the rendered row array
     */
    private rearrangeListNodes(scrollTopOverride?: number): void {
        const rowHeight = this.config.rowHeight
        const gridHeight = this.visibleRowIndices.length * rowHeight
        const renderedRows = this.renderedRows
        // the current top and bottom position of the viewport relatively to the scroll position
        const scrollTop: number = scrollTopOverride == void 0 ? this.dom.bodyWrapper.scrollTop : scrollTopOverride;
        const scrollBottom: number = scrollTop + this.bodyWrapperHeight;

        const allRowsHeight = renderedRows.length * rowHeight
        // the offset to the top
        // eg. the scrollTop is 100px and the row height is 48px
        // the offset would be 4 px (100 mod 48 = 4)
        let offset = scrollTop % rowHeight;

        // how many rows fit into the viewport
        let visibleViewportRowCount = Math.ceil((scrollBottom - scrollTop) / rowHeight)

        // the row threshold to the top
        let threshold = Math.floor((renderedRows.length - visibleViewportRowCount) / 2)
        let threshHoldInPixel = threshold * rowHeight

        // do we need to render yet?
        if (scrollTopOverride == void 0 && Math.abs(this.lastTop - scrollTop) < threshHoldInPixel / 2) {
            return
        }

        // the complete rows that are between 0 and the scroll top position
        let rowsToTopInPixel = scrollTop - offset
        // where to start drawing in px
        let start: number,
            visibleRowIndexesStart

        if (scrollTop === 0 || rowsToTopInPixel - threshHoldInPixel < 0) {
            // starting at the top
            start = 0;
            visibleRowIndexesStart = 0;
        } else if (scrollBottom + threshHoldInPixel > gridHeight) {
            // starting at the bottom
            start = gridHeight - allRowsHeight
            visibleRowIndexesStart = Math.floor(start / rowHeight)

        } else {
            // somewhere in the middle
            start = rowsToTopInPixel - threshHoldInPixel
            visibleRowIndexesStart = Math.floor(start / rowHeight)
        }

        for (let i = 0; i < renderedRows.length; i++) {
            let row = renderedRows[i]

            if (this.visibleRowIndices[visibleRowIndexesStart + i] == void 0) {
                break;
            }

            row.top = start + i * rowHeight
            row.index = this.visibleRowIndices[visibleRowIndexesStart + i]
        }

        this.lastTop = scrollTop

        this.Grid.RowController.renderRows();
    }
}
