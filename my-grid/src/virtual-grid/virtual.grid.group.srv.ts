import {
    IVirtualColumnRowGroup,
    IVirtualGrid,
    IVirtualGridDom,
    IVirtualGridRow
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";
import {VirtualGridRow} from "./virtual.grid.row.model";
import {VirtualGridUIDomController} from "./virtual.grid.ui.dom.srv";

export class VirtualGridGroupController {

    dom: IVirtualGridDom
    domController: VirtualGridUIDomController

    groups: IVirtualColumnRowGroup[] = []

    groupingDebounce

    constructor(private Grid: IVirtualGrid, private config: VirtualGridConfigController) {
        this.domController = this.Grid.domController
        this.dom = this.domController.dom
    }

    applyGrouping(suppressRefresh = false, suppressSorting = false) {

        // let s = +new Date()
        let rows
        let groupColumn = this.Grid.columns.find(x => x.isRowGroupColumn)
        let groupTree = {}

        if (groupColumn) {

            if (this.groups.length > 0) {
                !groupColumn.isVisible && groupColumn.api.show()
            } else {
                groupColumn.isVisible && groupColumn.api.hide()
            }
        }

        if (this.groups.length > 0) {

            for (let row of this.Grid.rows) {
                if (!row.isRowGroup) {
                    this._addGroupRows(groupTree, row)
                }
            }

            rows = this._createGroupRows(groupTree)

        } else {
            this._removeRowGroups()
            this.Grid.RowController.resetGridRowIndexes()
            this.Grid.api.refreshGrid(true, true);
            return
        }

        this.Grid.SelectionController.clearRangeSelection()
        this._generateTreeStructure(rows)

        // console.log("setting grouping / sorting status took -->", +new Date() - s)

        this.Grid.rows = this.Grid.Utils.flatten(rows)

        this.Grid.rows.forEach((row, index) => {
            row.index = index
        })

        if (this.Grid.SortController.sortedColumns.length && !suppressSorting) {
            this.Grid.SortController.applySorting(true)
        }

        if (!suppressRefresh) {
            this.Grid.api.refreshGrid(true, true);
        }
    }


    clearGrouping() {
        for (let col of this.Grid.columns) {
            if (col.isRowGrouped) {
                col.api.removeRowGroup()
            }
        }
    }

    setColGroups() {
        for (let col of this.Grid.columns) {
            if (col.isRowGrouped) {
                col.api.setRowGroup()
            }
        }
    }

    _addGroup(col, isActive = false) {
        let classes = isActive ? ["group"] : ["group", "inactive"]
        let element = this.Grid.Utils.el("div", classes, {"col-id": col.id})

        let group: IVirtualColumnRowGroup = {
            col,
            element,
            removeButton: this.Grid.Utils.el("i", ["group-remove-button", "virtual-material-icons", "small"]),
            label: col.title,
            isActive: isActive
        }

        element.textContent = group.label
        element.append(group.removeButton)

        group.removeButton.addEventListener("click", this._removeGroup)
        group.removeButton.textContent = "clear"

        this.groups.push(group)

        col.isRowGrouped = true
        col.rowGroup = group

        this.createGroupElements()

        return group
    }

    _removeGroup = (event): void => {
        let groupElement: HTMLElement = event.target.closest(".group")
        if (groupElement) {
            let colId = groupElement.getAttribute("col-id")
            let col = this.Grid.columns.find(x => x.id == colId)
            col.api.removeRowGroup()
        }
    }

    onGroupPanelMouseEnter = (): void => {
        if (this.Grid.DnDController.isColDragActive && !this.Grid.DnDController.colDragData.col.isRowGrouped) {
            this._addGroup(this.Grid.DnDController.colDragData.col)
        }
    }

    onGroupPanelMouseLeave = (): void => {
        if (this.Grid.DnDController.isColDragActive && this.Grid.DnDController.colDragData.col.rowGroup.isActive === false) {
            this.Grid.DnDController.colDragData.col.api.removeRowGroup()
        }
    }

    onGroupPanelMouseUp = (): void => {
        if (this.Grid.DnDController.isColDragActive && this.Grid.DnDController.colDragData.col.rowGroup != void 0) {

            let group = this.groups.find(x => x.col.id == this.Grid.DnDController.colDragData.col.id)

            if (!group || group.isActive) {
                return
            }

            this.Grid.DnDController.colDragData.col.rowGroup.element.classList.remove("inactive")
            this.Grid.DnDController.colDragData.col.rowGroup.isActive = true
            this.applyGrouping()
        }
    }

    private _generateTreeStructure(rows, level: number = 0, parent?) {
        let childKey = this.config.childNodesKey
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i]
            let children = row[childKey]

            row[childKey] = []

            if (row.isRowGroup) {
                let virtualRow: IVirtualGridRow = new VirtualGridRow(this.Grid, row)

                rows[i] = virtualRow
            }

            rows[i][childKey] = children
            rows[i].parent = parent
            rows[i].level = level

            if (children && children.length > 0) {
                this._generateTreeStructure(children, level + 1, row)
            }
        }
    }

    private _removeRowGroups() {
        let rows = []
        for (let row of this.Grid.rows) {
            if (!row.isRowGroup) {
                rows.push(row)
                row.isVisible = row.isVisibleAfterFilter
            }
        }

        this.Grid.rows = rows
    }

    _createGroupRows(treePart) {

        let rows = []

        let keys = Object.keys(treePart)

        for (let key of keys) {
            let rowNode: any = {isRowGroup: true}
            let childKey = this.Grid.ConfigController.childNodesKey
            rowNode.value = key
            rowNode[childKey] = []

            rows.push(rowNode)

            let treeNode = treePart[key]

            if (Object.keys(treeNode.rowGroups).length > 0) {
                rowNode[childKey] = this._createGroupRows(treeNode.rowGroups)
            } else {
                for (let _row of treeNode.children) {
                    rowNode[childKey].push(_row)
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

            if (value === "") {
                value = "[Empty]"
            }

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
            this.dom.groupPanelContent.append(this.groups[i].element)

            if (this.groups[i + 1] != void 0) {
                let spacer = this.Grid.Utils.el("i", ["group-spacer", "virtual-material-icons", "small"])
                spacer.textContent = "trending_flat"
                this.dom.groupPanelContent.append(spacer)
            }
        }
    }
}
