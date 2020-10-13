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
                showColumnFilter: true,
                selectionMethod: "range"
            }

            data.columns[0].pinned = "left"
            data.columns[1].pinned = "left"

            this.gridInstance = new VirtualGrid(config)
        });
    }

    filter(event) {
        this.gridInstance.api.setFilter(event.target.value)
    }
}
