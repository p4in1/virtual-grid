import {VirtualGridApi} from './virtual.grid.api.srv';
import {VirtualGridColumnController} from './virtual.grid.column.srv';
import {VirtualGridRowController} from './virtual.grid.row.srv';
import {VirtualGridUtils} from './virtual.grid.utils';
import {VirtualGridUIController} from './virtual.grid.ui.srv';
import {VirtualGridConfigController} from "./virtual.grid.config.srv";
import {VirtualGridFilterController} from "./virtual.grid.filter.srv";
import {
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridConfig,
    IVirtualGridRow
} from "./interfaces/virtual.grid.interfaces";
import {VirtualGridDragAndDropController} from "./virtual.grid.drag.srv";

export class VirtualGrid implements IVirtualGrid {
    /**
     * Returns an instance of a virtual grid
     */

    api: VirtualGridApi;
    ColumnController: VirtualGridColumnController;
    RowController: VirtualGridRowController;
    Utils: VirtualGridUtils;
    UI: VirtualGridUIController;
    ConfigController: VirtualGridConfigController
    FilterController: VirtualGridFilterController
    DnDController: VirtualGridDragAndDropController

    readonly initDone: boolean;

    rows: IVirtualGridRow[] = [];
    originalColumns: IVirtualGridColumn[] = [];

    columns: IVirtualGridColumn[] = [];

    childNodesKey: string;

    enableLogging: boolean = false

    constructor(readonly config: IVirtualGridConfig) {

        let gStart = +new Date();
        this.initDone = false;

        this.childNodesKey = this.config.childNodesKey != void 0 && this.config.childNodesKey !== '' ? this.config.childNodesKey : 'children';

        this.config = config;

        this.logTime("create api and utils -->", () => {
            this.api = new VirtualGridApi(this, this.config);
            this.Utils = new VirtualGridUtils();
        })

        this.logTime("parsing config -->", () => {
            this.ConfigController = new VirtualGridConfigController(this, this.config)
        })

        this.logTime("create Row and Column Controller -->", () => {
            this.ColumnController = new VirtualGridColumnController(this, this.config);
            this.RowController = new VirtualGridRowController(this, this.config);
        })

        this.logTime("creating row models -->", () => {
            this.rows = this.RowController.createRowModels(this.config.rows);
        })

        this.logTime("creating column models -->", () => {
            this.originalColumns = this.ColumnController.createColumnModels();

            let center = this.originalColumns.filter(col => col.pinned === "center")
            let left  = this.originalColumns.filter(col => col.pinned === "left")
            let right = this.originalColumns.filter(col => col.pinned === "right")

            this.columns = [...left, ...center, ...right]
            this.ColumnController.setCurrentColumnIndex()
        })

        this.logTime("create UI and Filter controller -->", () => {
            this.UI = new VirtualGridUIController(this, this.config);
            this.FilterController = new VirtualGridFilterController(this, this.config)
            this.DnDController = new VirtualGridDragAndDropController(this, this.config)
        })

        if (this.initDone == false) {

            this.logTime("create dom elements -->", () => {
                this.UI.createGrid();
            })

            this.logTime("set grid content -->", () => {
                this.api.setGridContent();
            })

            if (this.config.onGridReady && typeof (this.config.onGridReady) == 'function' && !this.initDone) {
                setTimeout(() => {
                    this.config.onGridReady(this);
                })
            }

            this.initDone = true;
        }

        console.log("grid ready after --> ", +new Date() - gStart)
    }

    /**
     * update the configuration of the grid once a new grid config is set
     */
    public updateConfigProperties = (): void => {

        this.RowController.updateConfigProperties(this.config);
        this.ColumnController.updateConfigProperties(this.config);
        this.api.updateConfigProperties(this.config);

        // this.rows = this.config.rows.slice();

        this.childNodesKey = this.config.childNodesKey != void 0 && this.config.childNodesKey !== '' ? this.config.childNodesKey : 'children';
    };


    public logTime(message, func) {
        if (this.enableLogging) {
            let s = +new Date();
            func()
            console.log(message, +new Date() - s);
        } else {
            func()
        }
    }
}
