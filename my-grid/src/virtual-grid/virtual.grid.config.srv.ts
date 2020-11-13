import {IVirtualColDefConfig, IVirtualGrid, IVirtualGridConfig} from "./interfaces/virtual.grid.interfaces";

/**
 * api controller
 * everything related to the api of a virtual grid instance goes here
 */

export class VirtualGridConfigController {

    colDefs: IVirtualColDefConfig[] = [];

    rowHeight: number = 40;
    headerRowHeight: number = 40;

    suppressSorting: boolean = false
    suppressResize: boolean = false
    suppressAutoSize: boolean = false
    suppressDragging: boolean = false
    suppressPinning: boolean = false
    suppressMoving: boolean = false
    suppressContextmenu: boolean = false;
    suppressContextmenuDefault: boolean = false;

    showHeader: boolean = false
    showGroupPanel: boolean = false
    showColumnFilter: boolean = false;

    isSingleSelect: boolean = true;
    isMultiSelect: boolean = false;
    isRangeSelect: boolean = false;

    element: HTMLElement;
    childNodesKey: string

    externalFilter: Function

    onGridReady: Function
    onRowClick: Function
    onRowMouseEnter: Function
    onRowMouseLeave: Function
    onRowDoubleClick: Function
    onRowRightClick: Function

    getContextMenuEntries: Function;
    onNodeExpandAsync: Function;

    headerValueGetter: Function

    expandNodesByDefault = false;
    selectLeavesOnly = false;
    deselectWhenCollapse = false;

    originalRows: any[] = []

    constructor(private Grid: IVirtualGrid, config: IVirtualGridConfig) {

        this.suppressSorting = config.suppressSorting
        this.suppressResize = config.suppressResize
        this.suppressAutoSize = config.suppressAutoSize
        this.suppressDragging = config.suppressDragging
        this.suppressPinning = config.suppressPinning
        this.suppressContextmenu = config.suppressContextmenu
        this.suppressContextmenuDefault = config.suppressContextmenuDefault

        this.showHeader = config.showHeader == void 0 ? true : config.showHeader
        this.showColumnFilter = config.showColumnFilter
        this.showGroupPanel = config.showHeader && config.showGroupPanel

        this.element = config.element

        this.isSingleSelect = !config.useMultiselect
        this.isMultiSelect = !!config.useMultiselect
        this.isRangeSelect = !!config.useRangeSelect

        this.headerValueGetter = config.headerValueGetter
        this.childNodesKey = config.childNodesKey != void 0 && config.childNodesKey !== '' ? config.childNodesKey : 'children';

        this.onGridReady = typeof config.onGridReady == "function" ? config.onGridReady : this._noop
        this.onRowClick = typeof config.onRowClick == "function" ? config.onRowClick : this._noop
        this.onRowMouseEnter = typeof config.onRowMouseEnter == "function" ? config.onRowMouseEnter : this._noop
        this.onRowMouseLeave = typeof config.onRowMouseLeave == "function" ? config.onRowMouseLeave : this._noop
        this.onRowDoubleClick = typeof config.onRowDoubleClick == "function" ? config.onRowDoubleClick : this._noop
        this.onRowRightClick = typeof config.onRowRightClick == "function" ? config.onRowRightClick : this._noop

        this.getContextMenuEntries = typeof config.getContextMenuEntries == "function" ? config.getContextMenuEntries : this._noop

        this.onNodeExpandAsync = config.onNodeExpandAsync;

        this.expandNodesByDefault = config.expandNodesByDefault == void 0 ? true : config.expandNodesByDefault;
        this.selectLeavesOnly = config.selectLeavesOnly;
        this.deselectWhenCollapse = config.deselectWhenCollapse;

        this.externalFilter = config.externalFilter

        this.originalRows = config.rows

        this.getColDefs(config)
    }

    private _noop = () => {
    }

    getColDefs(config) {

        if (this.showGroupPanel) {
            config.columns.unshift({
                suppressDragging: true,
                suppressMoving: true,
                isSystemColumn: true,
                isHierarchyColumn: true,
                isVisible: false,
                field: "value",
                title: "Groups"
            })
        }

        for (let col of config.columns) {

            let colDef: IVirtualColDefConfig = <IVirtualColDefConfig>{
                isMultiLine: false,
                lineCount: 1,
                title: col.title == void 0 ? "" : col.title,
                field: col.field,
                fieldPath: col.field ? col.field.indexOf(".") != -1 ? col.field.split(".") : [col.field] : [],

                type: col.type == void 0 ? "text" : col.type,

                isShowFilter: col.showFilter != void 0 ? col.showFilter : this.showColumnFilter,

                isActionColumn: col.type == "action",
                isIconColumn: col.type == "icon",
                isAvatarColumn: col.type == "avatar",
                isCheckboxColumn: col.checkbox,
                isHierarchyColumn: col.isHierarchyColumn,
                isSystemColumn: col.isSystemColumn,

                isRowGrouped: col.isRowGrouped,
                isVisible: col.isVisible == void 0 ? true : col.isVisible,

                isSuppressSort: col.suppressSorting || this.suppressSorting,
                isSuppressResize: col.suppressResize || this.suppressResize,
                isSuppressPinning: col.suppressPinning || this.suppressPinning,
                isSuppressDragging: col.suppressDragging || this.suppressDragging,
                isSuppressMoving: col.suppressMoving || this.suppressMoving,

                cellRenderer: col.cellRenderer,
                cellValueFormatter: col.cellValueFormatter,
                cellValueGetter: col.cellValueGetter,

                pinned: col.pinned && ["left", "right"].includes(col.pinned) ? col.pinned : "center",

                avatarConfig: col.avatarConfig,
                actions: [],

                width: col.width,
                minWidth: col.minWidth,
            }

            colDef.isPinned = colDef.pinned == "left" || colDef.pinned == "right";

            if (colDef.isShowFilter) {
                this.headerRowHeight = 80
                this.showColumnFilter = true
            }

            if (colDef.isActionColumn) {
                colDef.actions = col.actions
                colDef.width = 40 * col.actions.length
                this.setMinimumProperties(colDef)
            }

            if (colDef.isAvatarColumn) {
                colDef.width = 56
                this.setMinimumProperties(colDef)
            }


            if (colDef.type == "multiLine") {
                colDef.isMultiLine = true
                colDef.lineCount = this.getLineCount(colDef, config.rows)
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
        colDef.isSuppressResize = true;
        colDef.isShowFilter = false
    }

    getLineCount(colDef, rows) {
        let lineCount = 1;

        for (let row of rows) {
            let value = this.getValue(colDef, row)

            lineCount = Array.isArray(value) && value.length > lineCount ? value.length : lineCount

            if (Array.isArray(row[this.childNodesKey])) {
                let childLineCount = this.getLineCount(colDef, row[this.childNodesKey])
                lineCount = childLineCount > lineCount ? childLineCount : lineCount
            }
        }

        return lineCount
    }
}
