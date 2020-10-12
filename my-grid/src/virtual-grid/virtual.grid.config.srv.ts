import {IVirtualColDefConfig, IVirtualGrid, IVirtualGridConfig} from "./interfaces/virtual.grid.interfaces";

/**
 * api controller
 * everything related to the api of a virtual grid instance goes here
 */

export class VirtualGridConfigController {

    colDefs: IVirtualColDefConfig[] = [];

    rowLineCount: number = 1
    rowHeight: number = 40;
    headerRowHeight: number = 40;

    suppressSorting: boolean = false
    suppressResize: boolean = false
    suppressAutoSize: boolean = false
    suppressDragging: boolean = false
    suppressPinning: boolean = false
    showHeader: boolean = false
    showColumnFilter: boolean = false;
    selectionMethod: string
    element: HTMLElement;
    autoSizeColumns: boolean = false;
    headerValueGetter: Function
    childNodesKey: string

    externalFilter: Function

    onGridReady: Function
    onRowClick: Function
    onRowMouseEnter: Function
    onRowDoubleClick: Function
    onRowRightClick: Function

    onNodeExpandAsync: Function;

    expandNodesByDefault = false;
    useCheckboxSelection = false;
    useIntermediateNodes = false;
    deselectWhenCollapse = false;

    constructor(private Grid: IVirtualGrid, config: IVirtualGridConfig) {

        this.suppressSorting = config.suppressSorting
        this.suppressResize = config.suppressResize
        this.suppressAutoSize = config.suppressAutoSize
        this.suppressDragging = config.suppressDragging
        this.suppressPinning = config.suppressPinning
        this.showHeader = config.showHeader
        this.showColumnFilter = config.showColumnFilter
        this.element = config.element
        this.selectionMethod = config.selectionMethod == void 0 ? "single" : config.selectionMethod
        this.autoSizeColumns = config.autoSizeColumns
        this.headerValueGetter = config.headerValueGetter
        this.childNodesKey = config.childNodesKey != void 0 && config.childNodesKey !== '' ? config.childNodesKey : 'children';
        this.getColDefs(config)
        this.onGridReady = typeof config.onGridReady == "function" ? config.onGridReady : this._noop
        this.onRowClick = typeof config.onRowClick == "function" ? config.onRowClick : this._noop
        this.onRowMouseEnter = typeof config.onRowMouseEnter == "function" ? config.onRowMouseEnter : this._noop
        this.onRowDoubleClick = typeof config.onRowDoubleClick == "function" ? config.onRowDoubleClick : this._noop
        this.onRowRightClick = typeof config.onRowRightClick == "function" ? config.onRowRightClick : this._noop

        this.onNodeExpandAsync = config.onNodeExpandAsync;
        this.expandNodesByDefault = config.expandNodesByDefault == void 0 ? true : config.expandNodesByDefault;
        this.useCheckboxSelection = config.useCheckboxSelection;
        this.useIntermediateNodes = config.useIntermediateNodes;
        this.deselectWhenCollapse = config.deselectWhenCollapse;

        this.externalFilter = config.externalFilter
    }

    private _noop = () => {
    }

    getColDefs(config) {
        for (let col of config.columns) {

            let colDef: IVirtualColDefConfig = <IVirtualColDefConfig>{
                isMultiLine: false,
                lineCount: 1,
                field: col.field,
                fieldPath: col.field ? col.field.indexOf(".") != -1 ? col.field.split(".") : [col.field] : [],
                type: col.type == void 0 ? "text" : col.type,

                isShowFilter: col.showFilter != void 0 ? col.showFilter : this.showColumnFilter,

                isActionColumn: col.type == "action",
                isIconColumn: col.type == "icon",
                isAvatarColumn: col.type == "avatar",


                isCheckboxColumn: col.isCheckboxColumn,
                isHierarchyColumn: col.isHierarchyColumn,
                isAutosize: !col.suppressResize,

                isSuppressSort: col.suppressSorting || this.suppressSorting,
                isSuppressResize: col.suppressResize || this.suppressResize,
                isSuppressAutoSize: col.suppressAutoSize || this.suppressAutoSize,
                isSuppressDragging: col.suppressDragging || this.suppressDragging,
                isSuppressPinning: col.suppressPinning || this.suppressPinning,

                pinned: col.pinned && ["left", "right"].includes(col.pinned) ? col.pinned : "center",

                avatarConfig: col.avatarConfig,
                actions: [],

                width: col.width,
                minWidth: col.minWidth,

                title: col.title == void 0 ? "" : col.title,
                valueFormat: col.valueFormat
            }

            colDef.isPinned = colDef.pinned == "left" || colDef.pinned == "right";

            if (colDef.isCheckboxColumn) {
                colDef.type = "checkbox"
            }

            if (colDef.isShowFilter) {
                this.headerRowHeight = 80
                this.showColumnFilter = true
            }

            if (colDef.isActionColumn) {
                colDef.actions = col.actions
                colDef.width = 40 * col.actions.length
                this.setMinimumProperties(colDef)
            }

            if (colDef.isAvatarColumn || colDef.isCheckboxColumn) {
                colDef.width = 56
                this.setMinimumProperties(colDef)
            }

            for (let row of config.rows) {
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

        this.rowHeight += 12 // this works like a padding
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

    setMinimumProperties(colDef) {
        colDef.isSuppressSort = true;
        colDef.isSuppressFilter = true;
        colDef.isAutosize = false;
        colDef.isSuppressAutoSize = true;
        colDef.isSuppressResize = true;
        colDef.isShowFilter = false
    }

}
