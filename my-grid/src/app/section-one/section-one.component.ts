import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {VirtualGrid} from "../../virtual-grid/virtual.grid.service";
import {IVirtualGridConfig} from "../../virtual-grid/interfaces/virtual.grid.interfaces";

@Component({
    selector: 'app-section-one',
    templateUrl: './section-one.component.html',
    styleUrls: ['./section-one.component.scss']
})
export class SectionOneComponent implements OnInit {
    @ViewChild("grid") grid: ElementRef

    gridInstance

    constructor() {
    }

    ngOnInit(): void {
        fetch('assets/data.json').then(response => response.json()).then((data) => {
            let config: IVirtualGridConfig = {
                rows: data.rows,
                columns: data.columns,
                element: this.grid.nativeElement,
                showHeader: true,
                showColumnFilter: false,
                selectionMethod:"multi"
            }

            this.gridInstance = new VirtualGrid(config)
        });
    }

    filter(event) {
        this.gridInstance.api.setFilter(event.target.value)
    }
}
