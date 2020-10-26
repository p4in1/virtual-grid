import {
    IRenderedCell,
    IRenderedRow,
    IVirtualGrid,
    IVirtualGridRow
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridRow} from "./virtual.grid.row.model";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";
import {VirtualGridUIDomController} from "./virtual.grid.ui.dom.srv";

/**
 * the instance of the row controller
 * everything row related goes into this class
 */
export class VirtualGridRowController {

    selectedRows: IVirtualGridRow[] = [];

    constructor(protected Grid: IVirtualGrid, private config: VirtualGridConfigController, private domController: VirtualGridUIDomController) {
    }

    /**
     * processes the grid data and creates the grid rows from scratch
     */
    public buildRows = (): void => {
        this.selectedRows = [];
        // flatten the recursive structure
        this.Grid.rows = this.Grid.Utils.flatten(this.Grid.rows);
        this.setRowIndexes();
        // setting childCount for later usage
        this.setTotalChildCounts(this.Grid.rows);
    };
    /**
     * set the row indexes for each row
     */
    public setRowIndexes = (): void => {
        for (let i = 0; i < this.Grid.rows.length; i++) {
            this.Grid.rows[i].index = i;
            if (this.Grid.rows[i].initialIndex == void 0) {
                this.Grid.rows[i].initialIndex = this.Grid.rows[i].index
            }
        }
    };
    /**
     * sets the cumulative count of children per node
     * @param {Array<IVirtualGridRow>} rows
     */
    public setTotalChildCounts = (rows: IVirtualGridRow[]): void => {
        for (const row of rows) {
            if (row.level === 0 && row.children.length > 0) {
                row.childCountTotal = this.getCompleteChildCount(row);
            } else {
                row.childCountTotal = 0;
            }
        }
    };
    /**
     * Return the complete child count, not just one node level but the whole recursive structure
     *
     * @param {VirtualGridRow} row - the row to get the child count from
     * @returns {number}
     */
    public getCompleteChildCount = (row: IVirtualGridRow): number => {
        return this.getChildCount(row);
    };
    /**
     * creates an array with all row indexes that are currently displayable
     * this does not mean that every row is visible on the screen but these rows can be reached by scrolling
     */
    public rebuildVisibleRowMap = (): void => {
        this.domController.visibleRowIndices = [];

        for (let i = 0; i < this.Grid.rows.length; i++) {
            if (this.Grid.rows[i].isVisible && this.Grid.rows[i].isVisibleAfterFilter) {
                this.domController.visibleRowIndices.push(i);
            }
        }
    };
    /**
     * toggle the visibility of the rendered rows when there are more rendered rows than content rows
     */
    public toggleRenderedRowVisibility = (): void => {
        for (const row of this.domController.renderedRows) {

            [row.left, row.center, row.right].forEach((rowPartial) => {
                if (this.domController.visibleRowIndices.indexOf(row.index) == -1) {
                    rowPartial.element.style["display"] = "none";
                } else {
                    rowPartial.element.style["display"] = "flex";
                }
            });
        }
    };
    /**
     * Fill the grid with with rows for every visible entry.
     */
    public renderRows = (): void => {

        for (const row of this.domController.renderedRows) {
            if (row.index > this.Grid.rows.length - 1 || row.index < 0) {
                break;
            }

            this.renderRow(row);
        }
    };
    /**
     * Recalculate the position of the rendered rows when they are removed or the visibility changes
     *
     * @param startFromTop - optional - the start index
     */
    public calculateRowPosition = (startFromTop: boolean): void => {

        this.domController.reorderRenderedRows();

        const rowHeight: number = this.config.rowHeight;
        const renderedRows: IRenderedRow[] = this.domController.renderedRows;
        const renderedRowCount: number = this.domController.renderedRowCount;
        const visibleRowIndices: number[] = this.domController.visibleRowIndices;

        let currentIndex: number = startFromTop == true ? 0 : renderedRows[0].index;
        const firstRowTop: number = startFromTop == true ? 0 : renderedRows[0].top;

        if (startFromTop) {
            this.domController.dom.bodyWrapper.scrollTop = 0;
        }

        let count: number = 0;

        while (count < renderedRowCount) {

            if (this.Grid.rows[currentIndex] == void 0) {
                break;
            }

            if (this.Grid.rows[currentIndex].isVisible && this.Grid.rows[currentIndex].isVisibleAfterFilter) {
                renderedRows[count].index = currentIndex;
                renderedRows[count].top = (count * rowHeight) + firstRowTop;

                count++;
            }

            currentIndex++;
        }

        // we did not reach all rendered rows at this point
        // so we are going to reset the index and the top position of the remaining rows
        while (count < renderedRowCount) {

            const visibleRowIndex: number = visibleRowIndices.indexOf(renderedRows[0].index) - 1;
            let shiftedRows: number = 0;
            while (visibleRowIndex - shiftedRows >= 0 && count < renderedRowCount) {

                renderedRows[count].index = visibleRowIndices[visibleRowIndex - shiftedRows];
                renderedRows[count].top = renderedRows[0].top - (rowHeight * (shiftedRows + 1));

                count++;
                shiftedRows++;
            }

            if (count >= renderedRowCount) {
                break;
            }

            renderedRows[count].index = -1;
            renderedRows[count].top = (count * rowHeight) + firstRowTop;

            count++;
        }
    };
    /**
     * detaches the row and all it's children with the given index and removes it from the grid
     *
     * @param {number} rowIndex - the row to detach
     * @returns {Array} - the row and it's children
     */
    public detachRowByIndex = (rowIndex: number): any[] => {

        let rowsToRemove: number = rowIndex == this.Grid.rows.length - 1 ? 1 : this.Grid.rows.length - rowIndex;
        const rowToStart: any = this.Grid.rows[rowIndex];
        for (let i: number = Number(rowToStart.index) + 1; i < this.Grid.rows.length; i++) {

            if (this.Grid.rows[i].level <= rowToStart.level) {
                rowsToRemove = this.Grid.rows[i - 1].index - rowIndex + 1;
                break;
            }
        }

        if (rowToStart.parent != void 0) {
            for (const i in rowToStart.parent[this.config.childNodesKey]) {
                const childNode: any = rowToStart.parent[this.config.childNodesKey][i];

                if (childNode.index == rowToStart.index) {
                    rowToStart.parent[this.config.childNodesKey].splice(i, 1);
                    break;
                }
            }
        }

        return this.Grid.rows.splice(rowIndex, rowsToRemove);
    };
    /**
     * Move a row with it's children (if available) to the given destination index
     * @param rowIndexToMove - the row to move
     * @param rowIndexToAppend - the index where to move the row (and it's children)
     * @param appendAsChild - whether to append the moving row to the destination or insert it before
     */
    public moveRow = (rowIndexToMove: number, rowIndexToAppend: number, appendAsChild: boolean): void => {
        const targetRow: IVirtualGridRow = this.Grid.api.getRowByIndex(rowIndexToAppend);

        // if we attach the node as a child, we have to attach it as the last child of the target row
        let targetRowIndex: number = appendAsChild ? targetRow.index + this.getCompleteChildCount(targetRow) + 1 : rowIndexToAppend;

        const targetRowChildCountBefore: number = targetRow.childCountTotal;

        const rowsToMove: any[] = this.detachRowByIndex(rowIndexToMove);
        const rowToMove: any = rowsToMove[0];

        this.setRowIndexes();

        if (appendAsChild) {
            // in case the row to attach was already at the right index, but on the wrong level, we just add another 1
            // to add it as the child of the target row
            targetRowIndex = rowToMove.index == targetRow.index + 1 ? rowToMove.index : targetRowIndex;
        } else {
            targetRowIndex = rowIndexToAppend;
        }

        const targetRowChildCountAfter: number = this.getCompleteChildCount(targetRow);
        if (rowIndexToMove < rowIndexToAppend || targetRowChildCountAfter < targetRowChildCountBefore) {
            // at this point we removed n rows from the array and the target row moved up by the number of rows removed
            targetRowIndex -= rowsToMove.length;
        }

        const args: any = [targetRowIndex, 0].concat(rowsToMove);
        Array.prototype.splice.apply(this.Grid.rows, args);

        const sourceRow: IVirtualGridRow = rowToMove.parent;
        rowToMove.parent = targetRow;
        targetRow[this.config.childNodesKey].push(rowToMove);

        this.Grid.ColumnController.applySorting();

        const baseLevel: number =
            appendAsChild ? targetRow.level + 1 : targetRow.parent != void 0 ? targetRow.parent.level : 0;
        this.rebaseRowLevel(rowsToMove[0], baseLevel);

        targetRow.childCountTotal = this.getCompleteChildCount(targetRow);
        sourceRow.childCountTotal = this.getCompleteChildCount(sourceRow);

        this.toggleRow(targetRow, true);

        this.Grid.api.refreshGrid();
    };
    /**
     * inserts rows at the given index
     *
     * @param {number} rowIndexToInsert
     * @param {Array} rowsToInsert
     * @param {boolean} insertAsChildren - whether to append the rows to the given rowindex as children or insert it before
     */
    public insertRows = (rowIndexToInsert: number, rowsToInsert: any[], insertAsChildren: boolean): void => {
        let args: any;

        const startRow: IVirtualGridRow = this.Grid.api.getRowByIndex(rowIndexToInsert);
        let rows: IVirtualGridRow[] = this.createRowModels(rowsToInsert, startRow.level + 1, startRow);

        rows = this.Grid.Utils.flatten(rows);

        if (insertAsChildren) {
            let argsStart: any = [startRow.index + 1, 0];
            args = argsStart.concat(rows);
            Array.prototype.splice.apply(this.Grid.rows, args);

            startRow[this.config.childNodesKey] = startRow[this.config.childNodesKey].concat(rowsToInsert);
        } else {
            this.Grid.rows = this.Grid.rows.concat(rows);
        }

        this.setRowIndexes();
        this.setTotalChildCounts(rows);

        this.Grid.ColumnController.applySorting();
        this.Grid.api.refreshGrid();
    };
    /**
     * expand or collapse a row
     * @param row - the row to open or close
     * @param bool - whether the row shall be opened or closed
     */
    public toggleRow = (row: IVirtualGridRow, bool?: boolean): void => {

        if (row.isExpanded == bool && bool != void 0) {
            return; // already expanded or collapsed ... nothing to do
        }

        row.isExpanded = bool != void 0 ? bool : !row.isExpanded;

        if (row.isExpanded && typeof (this.config.onNodeExpandAsync) == "function") {
            row.isLoading = true;

            for (const renderedRow of this.domController.renderedRows) {
                if (renderedRow.index == row.index) {
                    this.renderRow(renderedRow);
                    break;
                }
            }

            this.config.onNodeExpandAsync({row, api: this.Grid.api},
                () => {
                    row.isLoading = false;

                    this.Grid.ColumnController.applySorting();
                    this.expandCollapse(row);
                });

        } else {
            this.expandCollapse(row);
        }

        this.Grid.api.refreshGrid();
    };

    executeAction = (event: any, action: any): void => {
        const row: IVirtualGridRow = this.Grid.eventController.getRowByEvent(event);

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        action.callback(row.rowData)
    }

    /**
     * Node click listener
     * @param {Object} event
     */
    public toggleNodeListener = (event: any): void => {
        const row: IVirtualGridRow = this.Grid.eventController.getRowByEvent(event);

        if (row.children != void 0) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }

        this.Grid.RowController.toggleRow(row);
    };

    /**
     * returns the value object of the given cell
     * @param rowData
     * @param path
     */
    getCellData(rowData, path) {

        let currentObject = rowData;

        for (let value of path) {

            if (currentObject[value] == void 0) {
                return ""
            }

            currentObject = currentObject[value]
        }

        return typeof currentObject == "string" ? currentObject.trim() : currentObject
    }

    /**
     * render a single row and update classes
     *
     * @param row
     */
    public renderRow(row: IRenderedRow): void {

        [row.right, row.center, row.left].forEach((rowPartial) => {

            rowPartial.element.setAttribute("number", row.index.toString());
            rowPartial.element.style["transform"] = `translateY(${row.top}px)`;
        });


        this.Grid.rows[row.index].renderedRow = row

        this.toggleSelectionClasses(this.Grid.rows[row.index]);

        for (const j in row.cells) {
            const cell: IRenderedCell = row.cells[j];

            cell.rowIndex = row.index;
            cell.colIndex = j
            cell.rowModel = this.Grid.rows[row.index];
            cell.colModel = this.Grid.columns[cell.colIndex];

            this._renderContent(cell)
            this._renderCheckbox(cell)
            this._renderAvatar(cell)
            this._renderCustomStyles(cell)
            this._renderTreeNode(cell)
        }
    }

    private _renderContent(cell: IRenderedCell) {
        let colType = cell.colModel.colType

        if (colType === "avatar" || colType === "action" || colType == "checkbox") {
            return
        }

        let cellData = this.getCellData(cell.rowModel.rowData, cell.fieldPath);

        if (typeof (cell.cellRenderer) == "function") {
            cell.textNodes[0].innerHTML = cell.cellRenderer(cell);
            return
        }

        if (typeof (cell.cellValueGetter) == "function") {
            let value = cell.cellValueGetter(cell, cellData)
            cell.textNodes[0].textContent = this._formatValue(cell, value)
            return
        }

        if (Array.isArray(cellData)) {

            for (let i = 0; i < cell.textNodes.length; i++) {
                cell.textNodes[i].innerHTML = cellData[i] == void 0 ? "" : cellData[i].toString().trim()
            }

            return
        }

        if (colType == "boolean") {
            let cellNode = this.Grid.Utils.el("i", ["action-icon", "virtual-material-icons"])

            cell.textNodes[0].innerHTML = ""
            cell.textNodes[0].classList.add("boolean-node");
            cell.textNodes[0].append(cellNode);

            let val = cellData === true || cellData === "true" ? true : cellData === false || cellData === "false" ? false : !!cellData


            cellNode.innerHTML = val === true ? "done" : ""

        } else {
            cell.textNodes[0].textContent = this._formatValue(cell, cellData);
        }
    }

    private _renderCheckbox(cell: IRenderedCell) {
        if (cell.checkboxNode) {
            cell.checkboxIcon.innerHTML = cell.rowModel.isSelected ? "done" : ""
        }
    }

    private _renderAvatar(cell: IRenderedCell) {
        if (cell.avatarNode) {
            let ph = "";
            let avatarConfig = cell.colModel.avatarConfig
            let avatarURL = this.getCellData(cell.rowModel.rowData, avatarConfig.url.split("."))

            cell.avatarPlaceholder.innerText = ""
            cell.avatarNode.style["background-image"] = ""
            cell.avatarNode.style["background-color"] = "transparent"

            if (avatarURL != "" && avatarURL != void 0) {
                cell.avatarPlaceholder.innerText = ""
                cell.avatarNode.style["background-image"] = `url(${avatarURL})`
            } else {
                for (let agg of avatarConfig.placeholderAgg) {
                    let data = this.getCellData(cell.rowModel.rowData, agg.split("."))
                    ph += data.trim().charAt(0).toUpperCase()
                }

                if (ph == "" && avatarConfig.hideEmptyPlaceholder) {
                    return
                }

                cell.avatarNode.style["background-image"] = ""
                cell.avatarPlaceholder.innerText = ph
                cell.avatarNode.style["background-color"] = avatarConfig.placeholderBgColor
            }
        }
    }

    private _renderTreeNode(cell: IRenderedCell) {
        if (cell.colModel.isHierarchyColumn) {
            cell.cellNode.style["padding-left"] = `${16 * cell.rowModel.level}px`;

            if (cell.treeNode != void 0) {
                const children: IVirtualGridRow[] = cell.rowModel.children;

                if (children != void 0 && children.length > 0) {
                    if (cell.rowModel.isExpanded && !cell.rowModel.isLoading) {
                        cell.treeNode.innerHTML = "remove"
                    } else {
                        cell.treeNode.innerHTML = "add"
                    }
                } else {
                    cell.treeNode.innerHTML = ""
                }
            }
        }
    }

    private _renderCustomStyles(cell: IRenderedCell) {
        if (cell.cellStyleGetter != void 0 && typeof (cell.cellStyleGetter) == "function") {
            let styles = cell.cellStyleGetter(cell);
            if (typeof (styles) == "object") {
                this.domController.setStyles(cell.cellNode, styles);
            }
        }
    }

    private _formatValue(cell: IRenderedCell, cellData: any) {
        if (cell.colModel.valueFormat == void 0) {
            return cellData
        } else {
            switch (cell.colModel.valueFormat) {
                case "currency":

                    if (cellData == void 0 || cellData === "") {
                        cellData = 0
                    }

                    return `${cellData.toFixed(2).replace(".", ",")} €`
            }
        }
    }

    /**
     * toggle visibility according to the parent visible state
     * @param row - the row to start from
     */
    public expandCollapse(row: IVirtualGridRow): void {

        for (let child of row.children) {
            child.isVisible = row.isExpanded && row.isVisibleAfterFilter;

            if (child.children.length > 0) {
                child.isExpanded = false;
                this.expandCollapse(child)
            }
        }

        // config property ... only deselect when this property is set to true, default is true
        if (this.config.deselectWhenCollapse) {
            this.deselectInvisible();
        }
    }

    /**
     * creates the VirtualGridRow templates with the given data
     * @param nodes - the raw nodes to iterate
     * @param nodeLevel - the current level
     * @param parent - the nodes parent
     * @param isRecursive - boolean whether this is a recursive call or not
     */
    public createRowModels(nodes: any[], nodeLevel: number = 0, parent?: any, isRecursive?: boolean): IVirtualGridRow[] {
        let rows: IVirtualGridRow[] = [];

        for (let node of nodes) {
            let row: IVirtualGridRow = new VirtualGridRow(this.Grid, node, nodeLevel, parent);

            if (row.isSelected) {
                this.selectedRows.push(row);
            }

            if (node[this.config.childNodesKey]) {
                row.children = this.createRowModels(node[this.config.childNodesKey], row.level + 1, row, true);
            }

            rows.push(row)
        }

        return rows;
    }

    /**
     * returns the childCount of a node and adds che children child count recursively
     * @param {VirtualGridRow} row
     * @return number
     */
    private getChildCount(row: IVirtualGridRow) {
        let count = row.children.length;

        if (row.children.length > 0) {
            for (let child of row.children) {
                row.childCountTotal = this.getChildCount(child);
                count += row.childCountTotal
            }
        }

        return count
    }

    /**
     * Alter the selection class of the row
     *
     * @param row
     * @param isSelected
     */
    public toggleSelectionClasses(row: IVirtualGridRow, isSelected?: boolean): void {
        [row.renderedRow.left, row.renderedRow.center, row.renderedRow.right].forEach((rowPartial) => {
            let isRowSelected = isSelected !== false && (row.isSelected || isSelected === true);

            this.Grid.Utils.toggleClass('selected', rowPartial.element, isRowSelected)
            this.Grid.Utils.toggleClass('selectable', rowPartial.element, row.isSelectable)
            this.Grid.Utils.toggleClass('not-selectable', rowPartial.element, !row.isSelectable)
        })
    }

    /**
     * rebase the level of a row and all its children in the case they were moved to another level
     *
     * @param row - the row to start rebasing
     * @param {number} baseLevel - the new base level
     */
    private rebaseRowLevel(row: any, baseLevel: number): void {
        row.level = baseLevel;

        if (row[this.config.childNodesKey] != void 0) {
            for (const i in row[this.config.childNodesKey]) {
                this.rebaseRowLevel(row[this.config.childNodesKey][i], baseLevel + 1);
            }
        }
    }

    /**
     * deselect all invisible rows
     */
    private deselectInvisible(): void {
        for (const row of this.Grid.rows) {

            if ((!row.isVisible || !row.isVisibleAfterFilter) && row.isSelected) {
                this.Grid.api.deselectRow(row);
            }
        }
    }
}
