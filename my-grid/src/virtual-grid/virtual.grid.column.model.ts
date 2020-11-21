import {
    IVirtualAvatar,
    IVirtualCellDom,
    IVirtualColumnAction,
    IVirtualColumnFilter,
    IVirtualColumnRowGroup,
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridColumnApi
} from "./interfaces/virtual.grid.interfaces";

import {VirtualGridColumnApi} from "./virtual.grid.column.api";

export class VirtualGridColumn implements IVirtualGridColumn {

    api: IVirtualGridColumnApi;

    index: number;
    currentIndex: number;

    id: string;

    field: string;
    fieldPath: string[];

    pinned: string = "center";

    rowGroup: IVirtualColumnRowGroup

    isRowGrouped: boolean = false
    isColGrouped: boolean = false
    isPinned: boolean = false;

    isFilterPresent: boolean = false;
    isShowFilter: boolean = false;
    isAutoResize: boolean = false;
    isVisible: boolean = true;

    isHierarchyColumn: boolean = false;
    isIconColumn: boolean = false;
    isCheckboxColumn: boolean = false;
    isActionColumn: boolean = false;
    isAvatarColumn: boolean = false;
    isSystemColumn: boolean = false;
    isRowGroupColumn: boolean = false;

    canShrink: boolean = false;

    isSuppressResize: boolean = false;
    isSuppressFilter: boolean = false;
    isSuppressSort: boolean = false;
    isSuppressDragging: boolean = false;
    isSuppressPinning: boolean = false;
    isSuppressMoving: boolean = false;

    sortDirection: string = null;

    title: string = "";

    left: number;
    width: number;
    minWidth: number;
    maxWidth: number;

    cellRenderer: Function;
    cellStyleGetter: Function;
    cellValueGetter: Function;
    cellValueFormatter: Function

    aggFunc: string | Function
    aggFuncTitle: string
    aggregateRowGroups: boolean
    aggValue: any
    
    colType: string
    colDef: any;

    dom: IVirtualCellDom = {
        cell: null,
        cellText: null,
        cellResizer: null,
        cellFilter: null,
        cellTrueFilter: null,
        cellFalseFilter: null,
        cellSortArrowContainer: null,
        cellSortArrow: null,
        cellSortArrowNumber: null,
        cellContent: null,
        cellTextContainer: null,
        cellFilterContainer: null,
        cellAggregationContainer: null,
        cellAggregationTitle: null,
        cellAggregationValue: null
    };

    filter: IVirtualColumnFilter

    lineCount = 1
    actions: IVirtualColumnAction[] = []
    avatarConfig: IVirtualAvatar;

    constructor(private Grid: IVirtualGrid, colDef: any, index: number) {
        let configColDef = this.Grid.ConfigController.colDefs[index]

        this.api = new VirtualGridColumnApi(Grid, this)

        this.id = this.Grid.Utils.generateUUID()

        this.index = index;
        this.currentIndex = index;

        this.title = configColDef.title;

        this.filter = {
            value: "",
            content: []
        }

        this.colDef = colDef;

        this.cellRenderer = typeof (configColDef.cellRenderer) == "function" ? configColDef.cellRenderer : null;
        this.cellStyleGetter = typeof (configColDef.cellStyleGetter) == "function" ? configColDef.cellStyleGetter : null;
        this.cellValueGetter = typeof (configColDef.cellValueGetter) == "function" ? configColDef.cellValueGetter : null;
        this.cellValueFormatter = typeof (configColDef.cellValueFormatter) == "function" ? configColDef.cellValueFormatter : null;

        this.aggFunc = configColDef.aggFunc
        this.aggFuncTitle = configColDef.aggFuncTitle
        this.aggregateRowGroups = configColDef.aggregateRowGroups
        this.aggValue = ""

        this.width = configColDef.width;
        this.minWidth = configColDef.minWidth == void 0 ? 80 : configColDef.minWidth;
        this.maxWidth = configColDef.minWidth == void 0 ? null : configColDef.maxWidth;

        this.isAvatarColumn = configColDef.isAvatarColumn;
        this.isActionColumn = configColDef.isActionColumn;
        this.isIconColumn = configColDef.isIconColumn;
        this.isCheckboxColumn = configColDef.isCheckboxColumn;
        this.isHierarchyColumn = configColDef.isHierarchyColumn;
        this.isSystemColumn = configColDef.isSystemColumn
        this.isRowGroupColumn = configColDef.isSystemColumn

        this.colType = configColDef.type;

        this.field = configColDef.field;
        this.fieldPath = configColDef.fieldPath;
        this.lineCount = configColDef.lineCount;

        this.actions = configColDef.actions;
        this.avatarConfig = configColDef.avatarConfig;

        this.pinned = configColDef.pinned;
        this.isPinned = configColDef.isPinned;
        this.isVisible = configColDef.isVisible
        this.isRowGrouped = configColDef.isRowGrouped

        this.isShowFilter = configColDef.isShowFilter;
        this.isAutoResize = !configColDef.isSuppressResize;
        this.isSuppressResize = configColDef.isSuppressResize;
        this.isSuppressDragging = configColDef.isSuppressDragging;
        this.isSuppressPinning = configColDef.isSuppressPinning;
        this.isSuppressMoving = configColDef.isSuppressMoving

        this.isSuppressSort = configColDef.isSuppressSort;
        this.isSuppressFilter = configColDef.isSuppressFilter;
    }
}
