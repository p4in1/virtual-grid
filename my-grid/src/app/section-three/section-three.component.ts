import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {
    IRenderedCell,
    IVirtualGrid, IVirtualGridColumn,
    IVirtualGridConfig, IVirtualGridContextmenuEntry,
    IVirtualGridRow
} from "../../virtual-grid/interfaces/virtual.grid.interfaces";
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

                if (item.data.user.userFirstName === "a" || item.data.user.userFirstName === "aaron") {
                    return
                }

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
            suppressContextmenu: false,
            suppressContextmenuDefault: false,
            getContextMenuEntries(row: IVirtualGridRow, col: IVirtualGridColumn): IVirtualGridContextmenuEntry[] {
                let entries: IVirtualGridContextmenuEntry[] = []

                entries.push(
                    {
                        label: "Custom entry", icon: "favorite", action(row, col) {
                            console.log("custom entry action")
                        }
                    }, {
                        isDivider: true
                    }, {
                        label: "Secondary action", icon: "fingerprint", action(row, col) {
                            console.log("I need fingerprints")
                        }
                    })

                return entries
            },
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
