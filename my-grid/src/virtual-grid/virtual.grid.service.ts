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

export class VirtualGrid implements IVirtualGrid {
    /**
     * Returns an instance of a virtual grid
     */

    api: VirtualGridApi;
    ColumnController: VirtualGridColumnController;
    RowController: VirtualGridRowController;
    Utils: VirtualGridUtils;
    ConfigController: VirtualGridConfigController
    FilterController: VirtualGridFilterController
    DnDController: VirtualGridDragAndDropController

    domController: VirtualGridUIDomController;
    eventController: VirtualGridUIEventController;

    rows: IVirtualGridRow[] = [];
    originalColumns: IVirtualGridColumn[] = [];

    columns: IVirtualGridColumn[] = [];

    readonly initDone: boolean;

    constructor(config: IVirtualGridConfig) {

        let gStart = +new Date();
        this.initDone = false;

        this.ConfigController = new VirtualGridConfigController(this, config)

        this.api = new VirtualGridApi(this, this.ConfigController);
        this.Utils = new VirtualGridUtils();

        this.domController = new VirtualGridUIDomController(this, this.ConfigController);
        this.eventController = new VirtualGridUIEventController(this, this.ConfigController, this.domController);

        this.ColumnController = new VirtualGridColumnController(this, this.ConfigController, this.domController);
        this.RowController = new VirtualGridRowController(this, this.ConfigController, this.domController);

        this.rows = this.RowController.createRowModels(config.rows);

        this.originalColumns = this.ColumnController.createColumnModels();

        let center = this.originalColumns.filter(col => col.pinned === "center")
        let left = this.originalColumns.filter(col => col.pinned === "left")
        let right = this.originalColumns.filter(col => col.pinned === "right")

        this.columns = [...left, ...center, ...right]
        this.ColumnController.setCurrentColumnIndex()

        this.FilterController = new VirtualGridFilterController(this, this.ConfigController)
        this.DnDController = new VirtualGridDragAndDropController(this)

        if (this.initDone == false) {

            this.domController.createGrid();

            this.eventController.bindEvents();

            // this needs to happen after the initial drawing
            setTimeout(() => {
                this.domController.calculateWrapper()
                this.ColumnController.calculateColumnWidth()
                this.domController.calculateScrollGuard()
                this.eventController.adjustCell(this.originalColumns, 0)
                this.eventController.bindGlobalOnResize()
            });

            this.api.setGridContent();

            setTimeout(() => {
                this.ConfigController.onGridReady(this);
            })

            this.initDone = true;
        }

        console.log("grid ready after --> ", +new Date() - gStart)
    }
}
