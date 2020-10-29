import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {VirtualGrid} from "../../virtual-grid/virtual.grid.service";
import {IVirtualGridConfig} from "../../virtual-grid/interfaces/virtual.grid.interfaces";

@Component({
    selector: 'app-section-one',
    templateUrl: './section-one.component.html',
    styleUrls: ['./section-one.component.scss']
})
export class SectionOneComponent implements AfterViewInit {
    @ViewChild("grid") grid: ElementRef
    @Input("data") data: any

    gridInstance

    constructor() {
    }

    ngAfterViewInit() {
        let data = this.data
        let config: IVirtualGridConfig = {
            rows: data.rows,
            columns: data.columns,
            element: this.grid.nativeElement,
            showHeader: true,
            showGroupPanel:true,
            selectionMethod: "range"
        }

        data.columns[0].pinned = "left"
        data.columns[1].pinned = "left"
        data.columns[1].type = "multiLine"

        data.columns[2].pinned = "right"
        data.columns[3].pinned = "right"

        this.gridInstance = new VirtualGrid(config)
    }

    filter(event) {
        this.gridInstance.api.setFilter(event.target.value)
    }
}
