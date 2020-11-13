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

    counter = 0

    getRandomFloat() {
        this.counter++
        return this.counter % 200 == 0 ? "" : this.counter % 191 == 0 ? undefined : this.counter % 173 == 0 ? 0 : Math.random() * 9999999;
    }

    getRandomInteger() {
        return Math.floor(Math.random() * (9999999 - 1) + 1);
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

        for (let i = 0; i < 8; i++) {
            data.rows.forEach((item) => {

                let test = {...item}

                test.lastName = this.getRandomLastName()
                test.float = this.getRandomFloat()
                test.integer = this.getRandomInteger()
                test.integer1 = this.getRandomInteger()
                test.integer2 = this.getRandomInteger()
                test.integer3 = this.getRandomInteger()
                test.integer4 = this.getRandomInteger()
                test.integer5 = this.getRandomInteger()
                test.integer6 = this.getRandomInteger()
                test.integer7 = this.getRandomInteger()
                test.integer8 = this.getRandomInteger()
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
                    field: "integer1",
                    title: "Integer",
                    type: "number",
                },
                {
                    field: "integer2",
                    title: "Integer",
                    type: "number",
                },
                {
                    field: "integer3",
                    title: "Integer",
                    type: "number",
                },
                {
                    field: "integer4",
                    title: "Integer",
                    type: "number",
                },
                {
                    field: "integer5",
                    title: "Integer",
                    type: "number",
                },
                {
                    field: "float",
                    title: "Float",
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
            useMultiselect: true,
            useRangeSelect: true,
            suppressContextmenu: false,
            suppressContextmenuDefault: false,
            getContextMenuEntries(row: IVirtualGridRow, col: IVirtualGridColumn): IVirtualGridContextmenuEntry[] {
                let entries: IVirtualGridContextmenuEntry[] = []

                entries.push(
                    {
                        label: "Custom entry",
                        icon: "favorite", action(row, col) {
                            console.log("custom entry action")
                        }
                    },
                    {
                        label: "Travel options",
                        icon: "navigation",
                        subMenu:[{
                            label: "Plane",
                            icon: "local_airport", action(row, col) {
                                console.log("Plane")
                            },
                        },{
                            label: "Bike",
                            icon: "directions_bike", action(row, col) {
                                console.log("Bike")
                            },
                        }]
                    },
                    {
                        isDivider: true
                    },
                    {
                        label: "Secondary action",
                        icon: "fingerprint", action(row, col) {
                            console.log("I need fingerprints")
                        }
                    }
                    )

                return entries
            }
        }

        this.gridInstance = new VirtualGrid(config)


        window["grid"] = this.gridInstance

    }
}
