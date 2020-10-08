import {IVirtualColDefConfig, IVirtualGrid} from "./interfaces/virtual.grid.interfaces";

/**
 * api controller
 * everything related to the api of a virtual grid instance goes here
 */

export class VirtualGridConfigController {

    colDefs: IVirtualColDefConfig[] = [];

    rowHeight: number = 40;
    rowLineCount: number = 1

    headerRowHeight: number = 40;

    constructor(private Grid: IVirtualGrid, private config: any) {

        for (let col of this.config.columns) {

            let colDef: IVirtualColDefConfig = <IVirtualColDefConfig>{
                isMultiLine: false,
                lineCount: 1,
                field: col.field,
                fieldPath: col.field ? col.field.indexOf(".") != -1 ? col.field.split(".") : [col.field] : [],
                type: col.type,

                isShowFilter: this.config.showColumnFilter || col.showFilter,

                isActionColumn: col.type == "action",
                isIconColumn: col.type == "icon",
                isCheckboxColumn: col.type == "checkbox",
                isAvatarColumn: col.type == "avatar",

                isAutosize: !col.suppressResize,

                isSuppressSort: col.suppressSorting || config.suppressSorting,
                isSuppressResize: col.suppressResize || config.suppressResize,
                isSuppressAutoSize: col.suppressAutoSize || config.suppressAutoSize,
                isSuppressDragging: col.suppressDragging || config.suppressDragging,
                isSuppressPinning: col.suppressPinning || config.suppressPinning,

                pinned: col.pinned && ["left", "right"].includes(col.pinned) ? col.pinned : "center",

                avatarConfig: col.avatarConfig,
                actions: [],

                width: col.width,
                minWidth: col.minWidth,

                title: col.title == void 0 ? "" : col.title,
                valueFormat: col.valueFormat
            }

            colDef.isPinned = colDef.pinned == "left" || colDef.pinned == "right";

            if (colDef.isShowFilter) {
                this.headerRowHeight = 80
            }

            if (colDef.isActionColumn) {
                colDef.actions = col.actions
                colDef.isSuppressSort = true;
                colDef.isSuppressFilter = true;
                colDef.width = 40 * col.actions.length
                colDef.isAutosize = false;
                colDef.isSuppressAutoSize = true;
                colDef.isSuppressResize = true;
                colDef.isShowFilter = false
            }

            if (colDef.isAvatarColumn) {
                colDef.isSuppressSort = true;
                colDef.isSuppressFilter = true;
                colDef.width = 56
                colDef.isAutosize = false;
                colDef.isSuppressAutoSize = true;
                colDef.isSuppressResize = true;
                colDef.isShowFilter = false
            }

            for (let row of this.config.rows) {
                let value = this.getValue(colDef, row)

                if (value === "") {
                    continue
                }

                if (Array.isArray(value)) {
                    colDef.isMultiLine = true
                    colDef.lineCount = value.length > colDef.lineCount ? value.length : colDef.lineCount
                    colDef.type = "multiLine"

                    if (colDef.lineCount > this.rowLineCount) {
                        this.rowLineCount = colDef.lineCount
                    }
                }
            }

            this.colDefs.push(colDef)
        }

        for (let col of this.colDefs) {
            let rowHeight = 40
            for (let j = 1; j < col.lineCount; j++) {
                rowHeight += 16
            }

            this.rowHeight = rowHeight > this.rowHeight ? rowHeight : this.rowHeight
        }

        if (this.config.style == "virtual-material") {
            this.rowHeight += 12 // this works like a padding
        }
    }

    getValue(col, row) {

        let currentObject = row;

        for (let value of col.fieldPath) {

            if (currentObject[value] == void 0) {
                return ""
            }

            currentObject = currentObject[value]
        }

        return currentObject
    }

}
