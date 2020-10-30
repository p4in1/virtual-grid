import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {IRenderedCell, IVirtualGrid, IVirtualGridConfig} from "../../virtual-grid/interfaces/virtual.grid.interfaces";
import {VirtualGrid} from "../../virtual-grid/virtual.grid.service";

@Component({
    selector: 'app-section-three',
    templateUrl: './section-three.component.html',
    styleUrls: ['./section-three.component.scss']
})
export class SectionThreeComponent implements AfterViewInit {
    gridInstance: IVirtualGrid
    @Input("data") data: any
    @ViewChild("grid") grid: ElementRef
    lastNames

    constructor() {
        window.onbeforeunload = () => {
            localStorage.setItem("virtual-grid-config", JSON.stringify(this.gridInstance.api.getConfig()))
        }
    }

    getRandomLastName() {
        let first = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        let second = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];

        return first + " - " + second
    }

    ngAfterViewInit() {

        this.lastNames = [];

        this.data.rows.forEach((item) => {
            this.lastNames.push(item.data.user.userLastName)
        })

        let data = this.data

        let items = []

        for (let i = 0; i < 30; i++) {
            data.rows.forEach((item) => {
                let test = {...item}

                test.lastName = this.getRandomLastName()
                items.push(test)
            })
        }

        let config: IVirtualGridConfig = {
            rows: items,
            columns: [
                {
                    type: "avatar",
                    avatarConfig: {
                        url: "data.user.avatarURL",
                        placeholderAgg: ["data.user.userFirstName", "data.user.userLastName"],
                        placeholderBgColor: "var(--color-primary)",
                        hideEmptyPlaceholder: true
                    },
                },
                {
                    field: "data.user.userFirstName",
                    title: "Vorname",
                    type: "text",
                    isRowGrouped: true
                },
                {
                    field: "lastName",
                    title: "Nachname"
                },
                {
                    field: "data.user.email",
                    title: "Email"
                },
                {
                    field: "data.user.phoneNumber",
                    title: "Telefonnummer"
                },
                {
                    type: "boolean",
                    field: "data.user.adminProperties.riskAssessment.deadlineDateSet",
                    title: "Auszahlung gefordert"
                },
                {
                    type: "date",
                    field: "data.user.adminProperties.riskAssessment.deadlineDateSet",
                    title: "Forderungs Datum",
                    cellValueFormatter(cell: IRenderedCell, value: any): any {
                        let date = new Date(value)
                        return value === "" ? "" : `${date.getFullYear()} / ${date.getMonth() + 1} / ${date.getDate()}`
                    }
                }
            ],
            element: this.grid.nativeElement,
            showHeader: true,
            showGroupPanel: true,
            selectionMethod: "multi",
            onGridReady(Grid: IVirtualGrid) {
                let config = JSON.parse(localStorage.getItem("virtual-grid-config"))
                if (config) {
                    Grid.api.setConfig(config)
                }
            }
        }

        this.gridInstance = new VirtualGrid(config)


        window["grid"] = this.gridInstance

    }
}
