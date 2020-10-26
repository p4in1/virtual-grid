import {
    IVirtualGrid,
    IVirtualGridColumn, IVirtualGridConfig, IVirtualGridContextmenuEntry,
    IVirtualGridRow,
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridContextMenu} from "./virtual.grid.contextmenu.model";

export class VirtualGridContextmenuController {

    contextmenu: VirtualGridContextMenu

    constructor(private Grid: IVirtualGrid, private config: IVirtualGridConfig) {

    }

    hideMenu = (): void => {
        this.contextmenu.hide(true)
    }

    showMenu(row: IVirtualGridRow, col: IVirtualGridColumn, event) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()

        let entries = this.getEntries()
        this.Grid.domController.dom.contextmenu.innerHTML = ""
        this.contextmenu = new VirtualGridContextMenu(this.Grid, this.Grid.domController.dom.contextmenu, entries, row, col, event)

        let _clickHandler = () => {
            this.hideMenu()
            document.body.removeEventListener("click", _clickHandler)
        }

        document.body.append(this.Grid.domController.dom.contextmenu)
        document.body.addEventListener("click", _clickHandler)
    }

    getEntries(): IVirtualGridContextmenuEntry[] {
        return [{
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

    exportAsCsv = () => {
        let selection = this.Grid.SelectionController.getSelection()
        if (this.config.selectionMethod == "range") {
            let rows = []
            for (let row of this._getPreformattedRows(selection)) {
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
    }

    copySelectionToClipboard = () => {
        let selection = this.Grid.SelectionController.getSelection()
        if (this.config.selectionMethod == "range") {
            let lines = ""


            for (let row of this._getPreformattedRows(selection)) {

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
    }

    _getPreformattedRows(selection) {
        let preFormatting = []
        let colLength = {}

        let firstRow = selection.range[0]
        let preFormattedColHeader = []

        firstRow.forEach((cell, index) => {

            let value = cell.colModel.title

            colLength[index] = 0
            colLength[index] = colLength[index] <= value.length ? value.length + 2 : colLength[index]
            preFormattedColHeader.push({value, idealLength: 0})
        })

        preFormatting.push(preFormattedColHeader)

        for (let row of selection.range) {
            let preFormattedRow = []

            row.forEach((cell, index) => {
                let value = cell.rowModel.getCellValue(cell.colModel)

                colLength[index] = colLength[index] <= value.length ? value.length + 2 : colLength[index]
                preFormattedRow.push({value, idealLength: 0})
            })

            preFormatting.push(preFormattedRow)
        }

        for (let row of preFormatting) {

            row.forEach((cell, index) => {
                cell.idealLength = colLength[index]
            })
        }

        return preFormatting
    }
}
