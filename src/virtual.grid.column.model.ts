import {
    IVirtualAvatar,
    IVirtualCellDom, IVirtualColumAction,
    IVirtualColumFilter,
    IVirtualGrid,
    IVirtualGridColumn
} from "./interfaces/virtual.grid.interfaces";
import {IVirtualGridColumnApi, VirtualGridColumnApi} from "./virtual.grid.column.api";

export class VirtualGridColumn implements IVirtualGridColumn {

    api: IVirtualGridColumnApi;

    index: number;
    currentIndex: number;

    id: string;

    field: string;
    fieldPath: string[];

    pinned: string = "center";

    isPinned: boolean = false;
    isFilterPresent: boolean = false;
    isShowFilter: boolean = false;
    isAutoResize: boolean = false;
    isVisible: boolean = true;
    isShowAsTree: boolean = false;
    isIconColumn: boolean = false;
    isCheckboxColumn: boolean = false;
    isActionColumn: boolean = false;
    isAvatarColumn: boolean = false;

    canShrink: boolean = false;

    isSuppressResize: boolean = false;
    isSuppressAutoSize: boolean = false;
    isSuppressFilter: boolean = false;
    isSuppressSort: boolean = false;
    isSuppressDragging: boolean = false;
    isSuppressPinning: boolean = false;

    sortDirection: string = null;

    title: string = "";

    valueFormat: string;

    left: number;
    width: number;
    minWidth: number;
    maxWidth: number;

    cellRenderer: Function;
    cellStyleGetter: Function;
    cellValueGetter: Function;

    colType: string
    colDef: any;

    dom: IVirtualCellDom = {
        cell: null,
        cellText: null,
        cellResizer: null,
        cellFilter: null,
        cellTrueFilter: null,
        cellFalseFilter: null,
        cellSortArrow: null,
        cellContent: null,
        cellTextContainer: null,
        cellFilterContainer: null
    };

    filter: IVirtualColumFilter

    lineCount = 1
    actions: IVirtualColumAction[] = []
    avatarConfig: IVirtualAvatar;

    constructor(private Grid: IVirtualGrid, colDef: any, index: number) {
        let configColDef = this.Grid.ConfigController.colDefs[index]

        this.api = new VirtualGridColumnApi(Grid, this)

        this.id = this.Grid.Utils.generateUUID()

        this.index = index;
        this.currentIndex = index;

        this.title = configColDef.title;
        this.valueFormat = configColDef.valueFormat

        this.filter = {
            value: "",
            content: []
        }

        this.maxWidth = colDef.maxWidth;
        this.cellRenderer = colDef.cellRenderer;
        this.cellStyleGetter = colDef.cellStyleGetter;
        this.cellValueGetter = colDef.cellValueGetter;
        this.colDef = colDef;

        this.isShowAsTree = colDef.showAsTree;

        // new variables


        this.width = configColDef.width;
        this.minWidth = configColDef.minWidth;
        this.isAvatarColumn = configColDef.isAvatarColumn;
        this.isActionColumn = configColDef.isActionColumn;
        this.isIconColumn = configColDef.isIconColumn;
        this.isCheckboxColumn = configColDef.isCheckboxColumn;

        this.colType = configColDef.type;

        this.field = configColDef.field;
        this.fieldPath = configColDef.fieldPath;
        this.lineCount = configColDef.lineCount;

        this.actions = configColDef.actions;
        this.avatarConfig = configColDef.avatarConfig;

        this.pinned = configColDef.pinned;
        this.isPinned = configColDef.isPinned;

        this.isShowFilter = configColDef.isShowFilter;
        this.isAutoResize = !configColDef.isSuppressResize;
        this.isSuppressResize = configColDef.isSuppressResize;
        this.isSuppressAutoSize = configColDef.isSuppressAutoSize;
        this.isSuppressDragging = configColDef.isSuppressDragging;
        this.isSuppressPinning = configColDef.isSuppressPinning;

        this.isSuppressSort = configColDef.isSuppressSort;
        this.isSuppressFilter = configColDef.isSuppressFilter;
    }
}
