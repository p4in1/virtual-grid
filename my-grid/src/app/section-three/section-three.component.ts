import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
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

    getRandomNumber() {
        return Math.random() * (9999999 - 1000000) + 1000000;
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

        for (let i = 0; i < 150; i++) {
            data.rows.forEach((item) => {

                if (item.data.user.userFirstName === "a" || item.data.user.userFirstName === "aaron") {
                    return
                }

                let test = {...item}

                test.lastName = this.getRandomLastName()
                test.stuff = this.getRandomNumber()
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
                    // isRowGrouped: true
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
                    title: "Forderungsdatum",
                    cellValueFormatter(cell: IRenderedCell, value: any): any {
                        let date = new Date(value)
                        return value === "" ? "" : `${date.getFullYear()} / ${date.getMonth() + 1} / ${date.getDate()}`
                    }
                },
                {
                    field: "data.amountToPay",
                    title: "Forderung",
                    type: "number",
                    cellValueFormatter(cell: IRenderedCell, value: any): any {
                        return value != void 0 && value != "" ? `${value} €` : ""
                    }
                },
                {
                    field: "stuff",
                    title: "Umsatz",
                    type: "number",
                    cellValueFormatter: function (cell: IRenderedCell, value: any): any {
                        if (value == void 0 || value == "") {
                            return ""
                        }
                        let newValue = []
                        let counter = 0;
                        let _value = value.toFixed(2)
                        let parts = _value.split(".")
                        let preNumber = parts[0].toString()

                        for (let i = preNumber.length - 1; i >= 0; i--) {
                            let char = preNumber[i]

                            if (/[0-9]/.test(char)) {
                                newValue.push(char)
                            }

                            counter++

                            if (counter % 3 == 0) {
                                newValue.push("'")
                            }
                        }

                        return `£ ${newValue.reverse().join("")}.${parts[1]}`
                    }
                },
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
            }
        }

        this.gridInstance = new VirtualGrid(config)


        window["grid"] = this.gridInstance

    }
}
