import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {VirtualGrid} from "../../virtual-grid/virtual.grid.service";
import {IVirtualGridConfig} from "../../virtual-grid/interfaces/virtual.grid.interfaces";

@Component({
    selector: 'app-section-two',
    templateUrl: './section-two.component.html',
    styleUrls: ['./section-two.component.scss']
})
export class SectionTwoComponent implements AfterViewInit {
    @ViewChild("grid") grid: ElementRef

    gridInstance

    constructor() {
    }

    ngAfterViewInit() {
        let config: IVirtualGridConfig = {
            showHeader: true,
            element: this.grid.nativeElement,
            columns: [{field: "value", title: "test"}],
            rows: [{value: "2"}, {value: "3"}, {value: "4"}]
        }

        this.gridInstance = new VirtualGrid(config)
    }

}
