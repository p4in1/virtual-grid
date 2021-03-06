import {VirtualGridApi} from './virtual.grid.api.srv';
import {VirtualGridColumnController} from './virtual.grid.column.srv';
import {VirtualGridRowController} from './virtual.grid.row.srv';
import {VirtualGridUtils} from './virtual.grid.utils';
import {VirtualGridConfigController} from "./virtual.grid.config.srv";
import {VirtualGridFilterController} from "./virtual.grid.filter.srv";
import {
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridConfig,
    IVirtualGridRow
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridDragAndDropController} from "./virtual.grid.drag.srv";
import {VirtualGridUIDomController} from "./virtual.grid.ui.dom.srv";
import {VirtualGridUIEventController} from "./virtual.grid.ui.event.srv";
import {VirtualGridContextmenuController} from "./virtual.grid.contextmenu.srv";
import {VirtualGridSelectionController} from "./virtual.grid.selection.srv";
import {VirtualGridSortController} from "./virtual.grid.sort.srv";
import {VirtualGridGroupController} from "./virtual.grid.group.srv";

export class VirtualGrid implements IVirtualGrid {
    /**
     * Returns an instance of a virtual grid
     */

    api: VirtualGridApi;
    ColumnController: VirtualGridColumnController;
    RowController: VirtualGridRowController;
    Utils: VirtualGridUtils;
    ConfigController: VirtualGridConfigController
    ContextmenuController: VirtualGridContextmenuController
    SelectionController: VirtualGridSelectionController
    FilterController: VirtualGridFilterController
    DnDController: VirtualGridDragAndDropController
    SortController: VirtualGridSortController
    GroupController: VirtualGridGroupController
    domController: VirtualGridUIDomController;
    eventController: VirtualGridUIEventController;

    rows: IVirtualGridRow[] = [];
    originalColumns: IVirtualGridColumn[] = [];

    columns: IVirtualGridColumn[] = [];

    readonly initDone: boolean;

    constructor(config: IVirtualGridConfig) {

        let log = [];
        let gStart = +new Date();
        this.initDone = false;

        let s = +new Date()
        this.ConfigController = new VirtualGridConfigController(this, config)
        this.ContextmenuController = new VirtualGridContextmenuController(this, this.ConfigController)
        this.SelectionController = new VirtualGridSelectionController(this, this.ConfigController)
        this.SortController = new VirtualGridSortController(this, this.ConfigController)

        log.push(`config took --> ${+new Date() - s}`)
        s = +new Date()

        this.api = new VirtualGridApi(this, this.ConfigController);
        this.Utils = new VirtualGridUtils(this);

        log.push(`api + utils took --> ${+new Date() - s}`)
        s = +new Date()

        this.domController = new VirtualGridUIDomController(this, this.ConfigController);
        this.eventController = new VirtualGridUIEventController(this, this.ConfigController, this.domController);


        log.push(`dom + event controller --> ${+new Date() - s}`)
        s = +new Date()

        this.ColumnController = new VirtualGridColumnController(this, this.ConfigController, this.domController);
        this.RowController = new VirtualGridRowController(this, this.ConfigController, this.domController);

        log.push(`row + column controller --> ${+new Date() - s}`)
        s = +new Date()


        this.originalColumns = this.ColumnController.createColumnModels();

        let center = this.originalColumns.filter(col => col.pinned === "center")
        let left = this.originalColumns.filter(col => col.pinned === "left")
        let right = this.originalColumns.filter(col => col.pinned === "right")

        this.columns = [...left, ...center, ...right]
        this.ColumnController.setCurrentColumnIndex()
        this.rows = this.RowController.createRowModels(config.rows);
        log.push(`rows + columns enriched in --> ${+new Date() - s}`)
        s = +new Date()

        this.FilterController = new VirtualGridFilterController(this, this.ConfigController)
        this.DnDController = new VirtualGridDragAndDropController(this, this.ConfigController)
        this.GroupController = new VirtualGridGroupController(this, this.ConfigController)

        log.push(`filter + dnd controller --> ${+new Date() - s}`)
        s = +new Date()

        if (this.initDone == false) {

            this.domController.createGrid();

            this.eventController.bindEvents();

            log.push(`grid dom + events binding took --> ${+new Date() - s}`)
            s = +new Date()

            // this needs to happen after the initial drawing
            setTimeout(() => {
                this.domController.calculateWrapper()
                this.ColumnController.calculateColumnWidth()
                this.domController.calculateScrollGuard()
                this.eventController.adjustCell(this.originalColumns, 0)
                this.eventController.bindGlobalOnResize()
                this.GroupController.setColGroups()

                if (this.GroupController.groups.length > 0) {
                    this.GroupController.applyGrouping()
                } else if (this.ConfigController.showColumnAggregation) {
                    this.ColumnController.aggregate()
                }
            });

            this.RowController.createGridContent();

            log.push(`setting the content --> ${+new Date() - s}`)
            s = +new Date()

            setTimeout(() => {
                this.ConfigController.onGridReady(this);
            })

            this.initDone = true;
        }

        console.log(log, `grid ready after --> ${gStart - s} with `, this.rows.length, " rows")
    }
}
