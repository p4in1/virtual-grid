import {VirtualGridUIDomController} from "./virtual.grid.ui.dom.srv";
import {VirtualGridUIEventController} from "./virtual.grid.ui.event.srv";
import {IVirtualGrid, IVirtualGridConfig} from "./interfaces/virtual.grid.interfaces";

export class VirtualGridUIController {

    domController: VirtualGridUIDomController;
    eventController: VirtualGridUIEventController;

    constructor(private Grid: IVirtualGrid, private config: IVirtualGridConfig) {
        this.domController = new VirtualGridUIDomController(this.Grid, this.config);
        this.eventController = new VirtualGridUIEventController(this.Grid, this.config, this.domController);
    }

    /**
     * initialize the grid instance
     * create the rows
     * bind click handler
     */
    public createGrid(): void {

        this.Grid.logTime("creating grid dom -->", () => {
            this.domController.createGrid();
        })

        this.Grid.logTime("calculate wrapper -->", () => {
            // this needs to happen after the initial drawing
            setTimeout(() => {
                this.domController.calculateWrapper()
                this.Grid.ColumnController.calculateColumnWidth()
                this.domController.calculateScrollGuard()
                this.Grid.UI.eventController.adjustCell(this.Grid.originalColumns, 0)
                this.Grid.UI.eventController.bindGlobalOnResize()
            });
        })

        this.Grid.logTime("binding events -->", () => {
            this.eventController.bindEvents();
        })

    }

    /**
     * resets the grid to the default settings
     */
    public resetGridProperties(): void {
        this.Grid.rows = [];

        this.domController.dom.bodyWrapper.scrollLeft = 0;
        this.domController.dom.bodyWrapper.scrollTop = 0;
    }

    /**
     * destroys the grid and it's content
     * releases listeners and clears all array to prevent memory leaks
     */
    public destroy = (): void => {
        this.domController.dom.virtualGrid.remove();
    }
}
