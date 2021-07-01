import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {IVirtualGrid} from "../../virtual-grid/interfaces/virtual.grid.interfaces";
import {VirtualGrid} from "../../virtual-grid/virtual.grid.service";

@Component({
    selector: 'app-section-four',
    templateUrl: './section-four.component.html',
    styleUrls: ['./section-four.component.scss']
})
export class SectionFourComponent implements AfterViewInit {
    gridInstance: IVirtualGrid
    @Input("data") data: any
    @ViewChild("grid") grid: ElementRef

    constructor() {
    }

    ngAfterViewInit(): void {
        var columns = [{title: 'Fruit', field: 'fruit', checkbox: true}, {title: 'Amount', field: 'amount'}]
        var rows = [{fruit: 'Apple', amount: 10}, {fruit: 'Banana', amount: 5}, {fruit: 'Pineapple', amount: 3}]
        var element = this.grid.nativeElement

        var gridConfig = {
            columns: columns,
            rows: rows,
            element: element,
            showHeader: true,
            rowHeight: 40,

        }

        new VirtualGrid(gridConfig)
    }
}
