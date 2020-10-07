import {VirtualGridConfigController} from "../virtual.grid.config.srv";
import {VirtualGridApi} from "../virtual.grid.api.srv";
import {VirtualGridColumnController} from "../virtual.grid.column.srv";
import {VirtualGridRowController} from "../virtual.grid.row.srv";
import {VirtualGridFilterController} from "../virtual.grid.filter.srv";
import {VirtualGridUtils} from "../virtual.grid.utils";
import {VirtualGridUIController} from "../virtual.grid.ui.srv";
import {VirtualGridDragAndDropController} from "../virtual.grid.drag.srv";

export interface IVirtualGrid {
    api: VirtualGridApi
    DnDController: VirtualGridDragAndDropController
    ColumnController: VirtualGridColumnController
    RowController: VirtualGridRowController
    ConfigController: VirtualGridConfigController
    FilterController: VirtualGridFilterController
    Utils: VirtualGridUtils
    UI: VirtualGridUIController

    childNodesKey: string

    config: any

    rows: IVirtualGridRow[]
    originalColumns: IVirtualGridColumn[]

    columns: IVirtualGridColumn[],

    logTime(message: string, callback: Function): void

    updateConfigProperties(): void
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
     * Determines if the Row can be found whilst scrolling
     * a row that is not visible might be the child of a collaped parent or be filtered from the rows array
     */
    isVisible: boolean
    isVisibleAfterFilter: boolean
    /**
     * Determines whether the row has children and can be collapsed
     */
    isCollapsible: boolean
    /**
     * Determines whether the row has children and the children are shown
     */
    isExpanded?: boolean
    /**
     * Determines whether the content of the row is still loading
     * This is useful in case the user / scripter / whatever uses the "onNodeExpandAsync" callback to show an indicator
     * if the content is still being loaded
     */
    isLoading?: boolean
    /**
     * indicates that the content of a node had to be requested asynchronously and that the request has finished
     */
    isLoadingFinished?: boolean
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
        cellTrueFilter: HTMLDivElement;
        cellFalseFilter: HTMLDivElement;
        cellSortArrow: HTMLElement

        cellContent: HTMLElement
        cellTextContainer: HTMLElement
        cellFilterContainer: HTMLElement
    }

    colDef: any
    title: string
    valueFormat: string

    pinned: string

    field?: string
    fieldPath?: string[]
    cellRenderer?: Function
    cellStyleGetter?: Function
    cellValueGetter?: Function

    isVisible?: boolean
    isFilterPresent: boolean
    isShowFilter?: boolean
    isAutoResize?: boolean
    isPinned: boolean
    isIconColumn?: boolean
    isAvatarColumn?: boolean
    isActionColumn?: boolean
    isCheckboxColumn?: boolean
    isShowAsTree?: boolean

    canShrink?: boolean

    sortDirection?: string

    colType: string

    isSuppressResize?: boolean
    isSuppressAutoSize?: boolean
    isSuppressFilter?: boolean
    isSuppressSort?: boolean
    isSuppressDragging?: boolean

    width?: number
    minWidth?: number
    maxWidth?: number

    left: number

    lineCount: number
    actions?: IVirtualColumAction[]
    avatarConfig?: IVirtualAvatar

    filter: IVirtualColumFilter
}

export interface IRenderedCell {
    textNodes: HTMLElement[]
    treeNode: HTMLElement
    checkboxNode: HTMLElement
    cellNode: HTMLElement
    avatarNode: HTMLElement
    avatarPlaceholder: HTMLElement
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
    scrollYCenterScrollport: HTMLElement

    ghost: HTMLElement
    ghostLabel: HTMLElement
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
}

export interface IVirtualColumFilter {
    value: string | boolean | number
    content: string[]
}

export interface IVirtualColumAction {
    color: string
    icon: string
    callback: Function
}

export interface IVirtualAvatar {
    url: string
    placeholderAgg: string[]
    placeholderBgColor: string
}

export interface IVirtualColDefConfig {
    isMultiLine: boolean
    lineCount: number
    field: string
    fieldPath: string[]
    type: string

    title: string
    valueFormat: string

    isAvatarColumn: boolean
    isActionColumn: boolean
    isIconColumn: boolean
    isCheckboxColumn: boolean

    isAutosize: boolean
    isShowFilter: boolean
    isPinned: boolean

    pinned: string

    isSuppressPinning: boolean
    isSuppressDragging: boolean
    isSuppressAutoSize: boolean
    isSuppressResize: boolean
    isSuppressSort: boolean
    isSuppressFilter: boolean

    actions: IVirtualColumAction[]
    avatarConfig?: IVirtualAvatar

    width: number
    minWidth: number
}
