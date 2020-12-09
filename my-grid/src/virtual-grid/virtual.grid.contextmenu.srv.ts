import {
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
        let selectedRows = this.Grid.SelectionController.getSelectedRows()

        let exportData = []

        for (let row of selectedRows) {
            let rowData = []

            for (let col of this.Grid.columns) {
                rowData.push({row, col})
            }

            exportData.push(rowData)
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
        let selectedRanges = this.Grid.SelectionController.getRangeSelection()
        let selectedRows = this.Grid.SelectionController.getSelectedRows()

        let exportData = []

        for (let row of selectedRows) {
            let rowData = []

            for (let col of this.Grid.columns) {
                rowData.push({row, col})
            }

            exportData.push(rowData)
        }

        let lines = ""

        if (exportData.length) {
            lines = this._getLines(exportData)
        }

        if (this.config.isRangeSelect) {
            for (let range of selectedRanges) {
                lines += this._getLines(range.rows)
            }
        }

        this.Grid.Utils.copyToClipboard(lines)
    }

    _getLines(data): string {

        let lines = ""
        for (let row of this._getPreformattedRows(data)) {

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

        lines += "\r\n"

        return lines
    }

    _getPreformattedRows(exportData) {
        let preFormatting = []
        let colLength = {}

        let firstRow = exportData[0]
        let preFormattedColHeader = []

        firstRow.forEach((obj: any) => {

            let colModel = obj.col
            if (!colModel.isVisible || colModel.isCheckboxColumn || colModel.colType == "avatar" || colModel.colType == "action") {
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

            row.forEach((obj: any) => {
                let colModel = obj.col
                if (!colModel.isVisible || colModel.isCheckboxColumn || colModel.colType == "avatar" || colModel.colType == "action") {
                    return;
                }

                let value = obj.row.getCellValue(colModel)
                let colId = colModel.id

                colLength[colId] = colLength[colId] <= value.length ? value.length + 2 : colLength[colId]
                preFormattedRow.push({value, idealLength: 0, colId})
            })

            preFormatting.push(preFormattedRow)
        }

        for (let row of preFormatting) {

            row.forEach((obj: any) => {
                obj.idealLength = colLength[obj.colId]
            })
        }

        return preFormatting
    }
}
