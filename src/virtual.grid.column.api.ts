import {IVirtualGrid, IVirtualGridColumn} from "./interfaces/virtual.grid.interfaces";

export interface IVirtualGridColumnApi {

}

export class VirtualGridColumnApi {

    constructor(private Grid: IVirtualGrid, private col: IVirtualGridColumn) {

    }

    pin = (area: string = "center") => {
        this._addMovingClass(()=>{
            this.Grid.DnDController.pinColumn(this.col, area)
        })
    }

    unpin = () => {
        this._addMovingClass(()=>{
            this.Grid.DnDController.pinColumn(this.col, "center")
        })
    }

    move = (index) => {
        this._addMovingClass(()=>{
            this.Grid.DnDController.moveColumn(this.col.currentIndex, index)
        })
    }

    private _addMovingClass(func){
        this.Grid.UI.domController.dom.gridContainer.classList.add("moving")

        func()

        setTimeout(()=>{
            this.Grid.UI.domController.dom.gridContainer.classList.remove("moving")
        },250)
    }
}
