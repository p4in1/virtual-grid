import {
    IRenderedCell,
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridContextmenuEntry,
    IVirtualGridRow,
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridContextMenu} from "./virtual.grid.contextmenu.model";
import {VirtualGridConfigController} from "./virtual.grid.config.srv";

export class VirtualGridContextmenuController {

    contextmenu: VirtualGridContextMenu

    constructor(private Grid: IVirtualGrid, private config: VirtualGridConfigController) {

    }

    hideMenu = (): void => {
        this.contextmenu.hide(true)
    }

    showMenu(row: IVirtualGridRow, col: IVirtualGridColumn, event) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()

        let entries = this.getEntries(row, col)
        this.Grid.domController.dom.contextmenu.innerHTML = ""
        this.contextmenu = new VirtualGridContextMenu(this.Grid, this.Grid.domController.dom.contextmenu, entries, row, col, event)

        let _clickHandler = () => {
            this.hideMenu()
            document.body.removeEventListener("click", _clickHandler)
        }

        document.body.append(this.Grid.domController.dom.contextmenu)
        document.body.addEventListener("click", _clickHandler)
    }

    getEntries(row: IVirtualGridRow, col: IVirtualGridColumn): IVirtualGridContextmenuEntry[] {

        let entries: IVirtualGridContextmenuEntry[] = []

        if (!this.config.suppressContextmenuDefault) {
            entries = [{
                icon: "content_copy",
                label: "Copy to clipboard",
                action: () => {
                    this.copySelectionToClipboard()
                }
            }, {
                icon: "get_app",
                label: "Export as CSV",
                action: () => {
                    this.exportAsCsv()
                }
            }]
        }

        let userEntries = this.config.getContextMenuEntries(row, col)
        if (userEntries && Array.isArray(userEntries)) {
            entries = entries.concat(userEntries)
        }

        return entries
    }

    exportAsCsv = () => {
        let selection = this.Grid.SelectionController.getSelection()

        let exportData = []

        if (this.config.selectionMethod == "range") {
            exportData = selection.range
        } else {
            for (let row of selection) {
                exportData.push(row.renderedRow.cells)
            }
        }

        let rows = []
        for (let row of this._getPreformattedRows(exportData)) {
            let _row = []
            row.forEach((cell) => {
                _row.push(cell.value)
            })

            rows.push(_row)
        }

        let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "export.csv");
        document.body.appendChild(link); // Required for FF

        link.click();

        document.body.removeChild(link)
    }

    copySelectionToClipboard = () => {
        let selection = this.Grid.SelectionController.getSelection()
        let exportData = []

        if (this.config.selectionMethod == "range") {
            exportData = selection.range
        } else {
            for (let row of selection) {
                exportData.push(row.renderedRow.cells)
            }
        }

        let lines = ""

        for (let row of this._getPreformattedRows(exportData)) {

            let line = ""

            row.forEach((cell) => {
                line += cell.value

                let diff = cell.idealLength - cell.value.length

                for (let i = 0; i < diff; i++) {
                    line += " "
                }
            })

            line += "\r\n"

            lines += line
        }

        this.Grid.Utils.copyToClipboard(lines)
    }

    _getPreformattedRows(exportData) {
        let preFormatting = []
        let colLength = {}

        let firstRow = exportData[0]
        let preFormattedColHeader = []

        firstRow.forEach((cell: IRenderedCell) => {

            let colModel = cell.colModel
            if (!colModel.isVisible || colModel.colType == "avatar" || colModel.colType == "action") {
                return;
            }

            let value = colModel.title
            let colId = colModel.id
            colLength[colId] = 0
            colLength[colId] = colLength[colId] <= value.length ? value.length + 2 : colLength[colId]
            preFormattedColHeader.push({value, idealLength: 0, colId})
        })

        preFormatting.push(preFormattedColHeader)

        for (let row of exportData) {
            let preFormattedRow = []

            row.forEach((cell: IRenderedCell) => {
                let colModel = cell.colModel
                if (!colModel.isVisible || colModel.colType == "avatar" || colModel.colType == "action") {
                    return;
                }

                let value = cell.rowModel.getCellValue(colModel)
                let colId = colModel.id

                colLength[colId] = colLength[colId] <= value.length ? value.length + 2 : colLength[colId]
                preFormattedRow.push({value, idealLength: 0, colId})
            })

            preFormatting.push(preFormattedRow)
        }

        for (let row of preFormatting) {

            row.forEach((cell: any) => {
                cell.idealLength = colLength[cell.colId]
            })
        }

        return preFormatting
    }
}
