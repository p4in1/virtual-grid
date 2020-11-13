import {VirtualGridConfigController} from "../virtual.grid.config.srv";
import {VirtualGridApi} from "../virtual.grid.api.srv";
import {VirtualGridColumnController} from "../virtual.grid.column.srv";
import {VirtualGridRowController} from "../virtual.grid.row.srv";
import {VirtualGridFilterController} from "../virtual.grid.filter.srv";
import {VirtualGridUtils} from "../virtual.grid.utils";
import {VirtualGridDragAndDropController} from "../virtual.grid.drag.srv";
import {VirtualGridUIDomController} from "../virtual.grid.ui.dom.srv";
import {VirtualGridUIEventController} from "../virtual.grid.ui.event.srv";
import {VirtualGridContextmenuController} from "../virtual.grid.contextmenu.srv";
import {VirtualGridContextMenu} from "../virtual.grid.contextmenu.model";
import {VirtualGridSelectionController} from "../virtual.grid.selection.srv";
import {VirtualGridSortController} from "../virtual.grid.sort.srv";
import {VirtualGridGroupController} from "../virtual.grid.group.srv";

export interface IVirtualGridConfig {

    /**
     * the dom element to attach the grid to
     */
    element: HTMLElement
    /**
     * the column definition
     */
    columns: IVirtualGridColumnConfig[]
    /**
     * rows to display
     */
    rows: any[]

    /**
     * whether the header is visible or not
     * @default true
     */
    showHeader?: boolean

    /**
     * whether the group panel is visible or not
     * if the option showHeader is set to false the group panel is not visible too
     * @default false
     */
    showGroupPanel?: boolean

    /**
     * whether to show the column filter or not
     * @default false
     */
    showColumnFilter?: boolean

    /**
     * the child nodes key is only necessary when you are dealing with tree structures
     * using this key the grid knows how to display the tree nodes
     * @default 'children'
     */
    childNodesKey?: string

    /**
     * enables multi selection holding the shift key for a range or ctrl for single items
     * enables multiple ranges to be selected
     * @property {string} single "single"
     * @property {string} multi "multi"
     * @default {string} single "single"
     */
    useMultiselect?: boolean

    /**
     * enables range selection
     */
    useRangeSelect?: boolean

    /**
     * deselects nodes when the parent has been collapsed
     * @default false
     */
    deselectWhenCollapse?: boolean

    /**
     * use this if you do not want to make expandable tree nodes selectable
     * in this case only leaves can be selected
     * @default false
     */
    selectLeavesOnly?: boolean

    /**
     * determines whether to expand nodes by default or not
     * @default false
     */
    expandNodesByDefault?: boolean

    /**
     * suppresses sorting on all columns
     * @default false
     */
    suppressSorting?: boolean

    /**
     * suppresses resizing on all columns
     * @default false
     */
    suppressResize?: boolean

    /**
     * suppresses auto sizing on all columns
     * @default false
     */
    suppressAutoSize?: boolean

    /**
     * suppresses dragging on all columns
     * @default false
     */
    suppressDragging?: boolean

    /**
     * suppresses the moving of columns
     * you can still drag them, but they won't change it's order
     */
    suppressMoving?: boolean
    /**
     * suppresses pinning on all columns
     * @default false
     */
    suppressPinning?: boolean

    /**
     * suppresses the build in contextmenu
     * @default false
     */
    suppressContextmenu?: boolean
    /**
     * this overrides the default and does not add the export and copy to clipboard actions
     */
    suppressContextmenuDefault?: boolean

    /**
     * callback before a node is expanded
     * this gives you the opportunity to load the children async and attach them to the grid using the api
     * @param row - the row to expand
     * @param api - the virtual grid api
     * @param done - a done callback you must call in order to tell the grid that the data is ready
     */
    onNodeExpandAsync?(row: IVirtualGridRow, api: VirtualGridApi, done: Function): void

    /**
     * external filter callback
     * return true - the row stays visible
     * return false - the row is invisible
     *
     * @param row - the row that might be filtered
     * @param filterValue - the current filter value
     */
    externalFilter?(row: IVirtualGridRow, filterValue: string): boolean

    /**
     * callback that returns the value of the header cell
     * @param column - the given column
     * @param api - the virtual grid api
     */
    headerValueGetter?(column: IVirtualGridColumn, api: VirtualGridApi): void

    /**
     * right click callback
     * @param row - the VirtualGridRow the event was executed on
     * @param event - the original event
     * @param api - grid api
     */
    onRowRightClick?(row: IVirtualGridRow, event: any, api: VirtualGridApi): void

    /**
     * double click callback
     * @param row - the VirtualGridRow the event was executed on
     * @param event - the original event
     * @param api - grid api
     */
    onRowDoubleClick?(row: IVirtualGridRow, event: any, api: VirtualGridApi): void

    /**
     * row mouse enter callback
     * @param row - the VirtualGridRow the event was executed on
     * @param event - the original event
     * @param api - grid api
     */
    onRowMouseEnter?(row: IVirtualGridRow, event: any, api: VirtualGridApi): void

    /**
     * row mouse leave callback
     * @param row - the VirtualGridRow the event was executed on
     * @param event - the original event
     * @param api - grid api
     */
    onRowMouseLeave?(row: IVirtualGridRow, event: any, api: VirtualGridApi): void

    /**
     * row click callback
     * @param row - the VirtualGridRow the event was executed on
     * @param event - the original event
     * @param api - grid api
     */
    onRowClick?(row: IVirtualGridRow, event: any, api: VirtualGridApi): void

    /**
     * a callback where the user can set the contextmenu entries for specific rows and columns
     * once the user right clicks a row / cell
     * @param row
     * @param col
     */
    getContextMenuEntries?(row: IVirtualGridRow, col: IVirtualGridColumn): IVirtualGridContextmenuEntry[]

    /**
     * grid ready callback
     * @param Grid - returns the grid as parameter
     */
    onGridReady?(Grid: IVirtualGrid): void
}

export interface IVirtualGridColumnConfig {

    field?: string
    title?: string
    type?: string

    showFilter?: boolean

    suppressResize?: boolean
    suppressSorting?: boolean
    suppressAutoSize?: boolean
    suppressMoving?: boolean
    suppressDragging?: boolean
    suppressPinning?: boolean

    checkbox?: boolean

    isRowGrouped?: boolean
    pinned?: string
    avatarConfig?: IVirtualAvatar
    actions?: IVirtualColumnAction[]
    width?: number
    minWidth?: number

    isHierarchyColumn?: boolean

    cellRenderer?(cell: IRenderedCell, value: any): HTMLElement

    cellValueGetter?(cell: IRenderedCell, value: any): any

    cellValueFormatter?(cell: IRenderedCell, value: any): any
}

export interface IVirtualGrid {
    api: VirtualGridApi
    Utils: VirtualGridUtils

    DnDController: VirtualGridDragAndDropController
    ColumnController: VirtualGridColumnController
    ContextmenuController: VirtualGridContextmenuController
    SelectionController: VirtualGridSelectionController

    RowController: VirtualGridRowController
    ConfigController: VirtualGridConfigController
    FilterController: VirtualGridFilterController
    SortController: VirtualGridSortController
    GroupController: VirtualGridGroupController

    domController: VirtualGridUIDomController
    eventController: VirtualGridUIEventController

    rows: IVirtualGridRow[]
    originalColumns: IVirtualGridColumn[]
    columns: IVirtualGridColumn[]
}

export interface VirtualGridCurrentFilter {
    text: string
    columns: {
        [key: string]: {
            value: string | number | boolean
            content: string[]
        }
    }
}

export interface IVirtualGridRow {
    value?: any
    /**
     * The level describes the current depth of the row
     * Starting at level 0 for the root
     */
    level: number
    /**
     * This is a boolean to determine whether the row is selectable or not
     * Rows that are not selectable are visualized with a lower opacity for they are readonly
     */
    isSelectable: boolean
    /**
     * Shows the selected state of a row
     * Rows that are selected will be added to the selectedRows of the RowController
     * Also selected rows are highlighted in a appealing color given by the theme
     */
    isSelected: boolean
    /**
     * is true when this is an aggregation row
     */
    isRowGroup: boolean
    /**
     * Determines if the Row can be found whilst scrolling
     * a row that is not visible might be the child of a collapsed parent or be filtered from the rows array
     */
    isVisible: boolean
    isVisibleAfterFilter: boolean
    /**
     * Determines whether the row has children and the children are shown
     */
    isExpanded?: boolean
    /**
     * The index of each row starting from 0
     * Caution: The Grids gets flatted and the index is given afterwards.
     * this means the row has an incrementing index regardless on which level the row lies
     *
     * The index increases in scrolling direction
     */
    index: number
    initialIndex: number
    /**
     * The original rowData given by the user to build the rows
     */
    rowData: any
    renderedRow?: IRenderedRow
    /**
     * the total children count
     * This number is used once we want to add rows to a certain index
     * e.g row "a" is collapsed and has 12 children and we want to add the row after row "a"
     * at this point we need the index of the row and the total children count to insert the given rows at the index we want to
     */
    childCountTotal?: number
    /**
     * The parent to traverse upwards and to check if the parent node is visible or expanded
     */
    parent?: IVirtualGridRow
    /**
     * a list of Children
     */
    children?: IVirtualGridRow[]

    /**
     * updates the row data of a row instance and refreshes the grid row
     * @param rowData - the new data
     */
    updateRowData(rowData: any): void

    getCellValue(col: IVirtualGridColumn, options?: IVirtualGetCellValueOptions): any
}

export interface IVirtualGridColumnApi {
    /**
     * pins the column to the given area
     * areas are left, right and center whereas center is the same as the unpin function
     *
     * the column will be the last if pinned left or the first if pinned right
     * @param area - the area where to pin the column
     */
    pin(area: string): void

    /**
     * unpins the column where ever it is
     * this shifts the column to the center viewport at the last index
     */
    unpin(): void

    /**
     * moves the column to the given index
     * if the index is part of the pinned columns, the column will be pinned to the left or
     * right pin area
     *
     * @param index
     */
    move(index: number): void

    /**
     * creates row groups with this column
     */
    setRowGroup(): void

    /**
     * sets the column's width to the given value if possible
     * either minWidth or maxWidth could be suppressing this
     * @param width
     */
    setWidth(width: number): void

    /**
     * removes the grouping of this column
     */
    removeRowGroup(): void

    /**
     * shrinks or grows the column to the size fitting for the content
     */
    sizeToFit(): void

    show(): void

    hide(): void
}

export interface IVirtualGridColumn {
    index: number
    currentIndex: number

    id: string

    dom: {
        cell: HTMLElement
        cellText: HTMLElement
        cellResizer: HTMLElement
        cellFilter: HTMLInputElement
        cellFilterAdvancedButton: HTMLElement
        cellTrueFilter: HTMLDivElement;
        cellFalseFilter: HTMLDivElement;
        cellSortArrow: HTMLElement

        cellContent: HTMLElement
        cellTextContainer: HTMLElement
        cellFilterContainer: HTMLElement
    }

    api: IVirtualGridColumnApi

    colDef: any
    title: string

    pinned: string

    field?: string
    fieldPath?: string[]

    cellRenderer?: Function
    cellStyleGetter?: Function
    cellValueGetter?: Function
    cellValueFormatter?: Function

    isVisible?: boolean
    isFilterPresent: boolean
    isShowFilter?: boolean
    isAutoResize?: boolean

    isPinned: boolean
    isColGrouped: boolean
    isRowGrouped: boolean

    isIconColumn?: boolean
    isAvatarColumn?: boolean
    isActionColumn?: boolean
    isCheckboxColumn?: boolean
    isHierarchyColumn?: boolean
    isRowGroupColumn?: boolean
    isSystemColumn?: boolean

    canShrink?: boolean

    sortDirection?: string

    colType: string

    isSuppressResize?: boolean
    isSuppressFilter?: boolean
    isSuppressSort?: boolean
    isSuppressDragging?: boolean
    isSuppressMoving?: boolean
    isSuppressPinning?: boolean

    width?: number
    minWidth?: number
    maxWidth?: number

    left: number

    lineCount: number
    actions?: IVirtualColumnAction[]
    avatarConfig?: IVirtualAvatar

    filter: IVirtualColumnFilter

    rowGroup: IVirtualColumnRowGroup
}

export interface IRenderedCell {
    textNodes: HTMLElement[]
    treeNode: HTMLElement
    treeChildCountNode: HTMLElement
    checkboxNode: HTMLElement
    checkboxIcon: HTMLElement
    cellNode: HTMLElement
    cellContentNode: HTMLElement
    avatarNode: HTMLElement
    avatarPlaceholder: HTMLElement

    cellId: string
    colId: string
    field: string
    fieldPath: string[]

    rowIndex: number | string
    colIndex: number | string
    rowModel: IVirtualGridRow
    colModel: IVirtualGridColumn

    cellRenderer: Function
    cellValueGetter: Function
    cellStyleGetter: Function
}

export interface IRenderedRowPartial {
    cells: IRenderedCell[],
    element: HTMLElement
}

export interface IRenderedRow {
    index: number;
    isVisible: boolean;
    top: number;
    cells: IRenderedCell[]
    left: IRenderedRowPartial
    center: IRenderedRowPartial
    right: IRenderedRowPartial
}

export interface IVirtualGridDom {
    virtualGrid: HTMLElement

    headerWrapper: HTMLElement
    headerCenterScrollPort: HTMLElement

    bodyWrapper: HTMLElement
    bodyCenterScrollPort: HTMLElement
    bodyCenter: HTMLElement
    bodyLeft: HTMLElement
    bodyRight: HTMLElement

    headerCenter: HTMLElement
    headerLeft: HTMLElement
    headerRight: HTMLElement

    headerLeftResizer: HTMLElement
    headerRightResizer: HTMLElement

    gridContainer: HTMLElement
    swipeActionElement: HTMLElement

    scrollYGuard: HTMLElement
    scrollYLeftSpacer: HTMLElement
    scrollYRightSpacer: HTMLElement
    scrollYCenterSpacer: HTMLElement
    scrollYCenterScrollPort: HTMLElement

    ghost: HTMLElement
    ghostLabel: HTMLElement

    groupPanel: HTMLElement
    groupPanelPlaceholder: HTMLSpanElement
    groupPanelContent: HTMLElement

    contextmenu: HTMLElement
    contextmenuBackdrop: HTMLElement
}

export interface IVirtualCellDom {
    cell: HTMLElement
    cellText: HTMLElement
    cellResizer: HTMLElement
    cellFilter: HTMLInputElement
    cellTrueFilter: HTMLDivElement
    cellFalseFilter: HTMLDivElement
    cellSortArrow: HTMLElement
    cellContent: HTMLElement
    cellTextContainer: HTMLElement
    cellFilterContainer: HTMLElement
    cellFilterAdvancedButton: HTMLElement
}

export interface IVirtualColumnFilter {
    value: string | boolean | number
    content: string[]
}

export interface IVirtualColumnAction {
    color: string
    icon: string
    callback: Function
}

export interface IVirtualColumnRowGroup {
    label: string
    element: HTMLElement
    removeButton: HTMLElement
    col: IVirtualGridColumn
    isActive: boolean
}

export interface IVirtualAvatar {
    /**
     * the image url
     */
    url: string

    /**
     * the aggregation for the placeholder
     */
    placeholderAgg: string[]

    /**
     * the background-color
     */
    placeholderBgColor: string

    /**
     * hides empty placeholder in case there is no data to show
     */
    hideEmptyPlaceholder?: boolean
}

export interface IVirtualColDefConfig {
    isMultiLine: boolean
    lineCount: number
    field: string
    fieldPath: string[]
    type: string

    title: string

    isAvatarColumn: boolean
    isActionColumn: boolean
    isIconColumn: boolean
    isCheckboxColumn: boolean
    isHierarchyColumn: boolean
    isSystemColumn: boolean

    isShowFilter: boolean
    isPinned: boolean
    isVisible: boolean
    isRowGrouped: boolean

    pinned: string

    isSuppressPinning: boolean
    isSuppressDragging: boolean
    isSuppressResize: boolean
    isSuppressSort: boolean
    isSuppressFilter: boolean
    isSuppressMoving: boolean

    actions: IVirtualColumnAction[]
    avatarConfig?: IVirtualAvatar

    width: number
    minWidth: number
    maxWidth: number

    cellRenderer(): void

    cellStyleGetter(): void

    cellValueGetter(): void

    cellValueFormatter(): void
}

export interface IVirtualGridContextmenuEntry {
    label?: string
    index?: number
    icon?: string
    subMenu?: IVirtualGridContextmenuEntry[]
    isDivider?: boolean
    element?: HTMLElement

    subMenuInstance?: VirtualGridContextMenu

    action?(row, col): void
}

export interface IVirtualDragData {
    x: number,
    y: number,
    col: IVirtualGridColumn,
    cell: HTMLElement,
    rect: ClientRect,
    offset: number,
    pinned: string
}

export interface IVirtualGetCellValueOptions {
    stringify?: boolean
    format?: boolean
}
