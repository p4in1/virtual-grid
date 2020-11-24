import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {
    IValueFormatterParams,
    IVirtualGrid,
    IVirtualGridConfig,
    IVirtualGridContextmenuEntry, IVirtualGridRow,
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

    getRandomBoolean() {
        let booleans = [true, false, null]

        return booleans[Math.floor(Math.random() * booleans.length)];
    }

    ngAfterViewInit() {

        this.lastNames = [];

        this.data.rows.forEach((item) => {
            this.lastNames.push(item.data.user.userLastName)
        })

        let data = this.data

        let items = []

        for (let i = 0; i < 32; i++) {
            data.rows.forEach((item) => {

                let test = {...item}

                test.lastName = this.getRandomLastName()
                test.float = this.getRandomFloat()
                test.boolean = this.getRandomBoolean()
                test.integer0 = this.getRandomInteger()
                test.integer1 = this.getRandomInteger()
                test.integer2 = this.getRandomInteger()
                test.integer3 = this.getRandomInteger()
                test.integer4 = this.getRandomInteger()
                test.integer5 = this.getRandomInteger()
                items.push(test)
            })
        }

        let numbers = [0, 1, 2, 3, 4, 5]
        // let counter = 0;
        //
        //
        // setTimeout(() => {
        // setInterval(() => {
        //     let s = +new Date()
        //     for (let row of items) {
        //         let field = `integer${numbers[Math.floor(Math.random() * numbers.length)]}`
        //         row[field] = this.getRandomInteger()
        //     }
        //
        //     // console.log("updating 100k cells took -->", +new Date() - s)
        //
        //     this.gridInstance.api.updateRows()
        //     this.gridInstance.api.updateAggregates()
        // }, 475)
        //
        //     // setInterval(() => {
        //     //     for (let row of items) {
        //     //         let field = `integer${numbers[Math.floor(Math.random() * numbers.length)]}`
        //     //         row[field] = this.getRandomInteger()
        //     //     }
        //     // }, 700)
        // }, 2000)


        const thousandSeparatorFormatter = (params: IValueFormatterParams, value: any) => {

            if (value == void 0 || value == "") {
                return ""
            }

            let parts = Number(value).toFixed(value.toString().includes(".") ? 2 : 0).toString().split(".");
            let newValue = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'") + (parts[1] ? "." + parts[1] : "");

            return `£ ${newValue}`
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
                    field: "boolean",
                    title: "Auszahlung gefordert",
                    isRowGrouped: true
                },
                {
                    type: "date",
                    field: "data.user.adminProperties.riskAssessment.deadlineDateSet",
                    title: "Forderungsdatum",
                    cellValueFormatter(cell: IValueFormatterParams, value: any): any {
                        let date = new Date(value)
                        return value === "" ? "" : `${date.getFullYear()} / ${date.getMonth() + 1} / ${date.getDate()}`
                    }
                },
                {
                    field: "data.amountToPay",
                    title: "Forderung",
                    type: "number",
                    cellValueFormatter(cell: IValueFormatterParams, value: any): any {
                        return value != void 0 && value != "" ? `${value} €` : ""
                    }
                },
                {
                    field: "integer0",
                    title: "Integer",
                    type: "number"
                },
                {
                    field: "integer1",
                    title: "Integer",
                    type: "number",
                    aggFunc: "min",
                    aggregateRowGroups: true,
                    cellValueFormatter(cell: IValueFormatterParams, value: any): any {
                        return value != void 0 && value != "" ? `${value} €` : ""
                    }
                },
                {
                    field: "integer2",
                    title: "Integer",
                    type: "number",
                    aggFunc: "max",
                    aggregateRowGroups: true,
                    cellValueFormatter(cell: IValueFormatterParams, value: any): any {
                        return value != void 0 && value != "" ? `${value} €` : ""
                    }
                },
                {
                    field: "integer3",
                    title: "Integer",
                    type: "number",
                    aggFunc: "avg"
                },
                {
                    field: "integer4",
                    title: "Integer",
                    type: "number",
                    aggFunc: "sum",
                    aggregateRowGroups: true,
                    cellValueFormatter: thousandSeparatorFormatter
                },
                {
                    field: "integer5",
                    title: "Integer",
                    type: "number",
                    aggFuncTitle: "L33t",
                    aggFunc: () => {
                        return 1337
                    }
                },
                {
                    field: "float",
                    title: "Float",
                    type: "number",
                    cellValueFormatter: thousandSeparatorFormatter
                },
                {
                    pinned: "right",
                    type: "action",
                    actions: [
                        {
                            icon: "delete", color: "red", callback: (row: IVirtualGridRow) => {
                                row.remove()
                            }
                        }, {
                            icon: "add", color: "blue", callback: (row: IVirtualGridRow) => {
                                row.setData({
                                    lastName: this.getRandomLastName(),
                                    float: this.getRandomFloat(),
                                    boolean: this.getRandomBoolean(),
                                    integer0: this.getRandomInteger(),
                                    integer1: this.getRandomInteger(),
                                    integer2: this.getRandomInteger(),
                                    integer3: this.getRandomInteger(),
                                    integer4: this.getRandomInteger(),
                                    integer5: this.getRandomInteger()
                                })
                                this.gridInstance.api.updateAggregates()
                                this.gridInstance.api.refreshGrid(true)
                            }
                        }
                    ]
                }
            ],
            element: this.grid.nativeElement,
            showHeader: true,
            showGroupPanel: true,
            showColumnFilter: true,
            showColumnAggregation: true,
            isMultiselect: true,
            isRangeSelect: true,
            suppressContextmenu: false,
            suppressContextmenuDefault: false,
            suppressFlashingCells: false,
            getContextMenuEntries(): IVirtualGridContextmenuEntry[] {
                let entries: IVirtualGridContextmenuEntry[] = []

                entries.push(
                    {
                        label: "Custom entry",
                        icon: "favorite", action() {
                            console.log("custom entry action")
                        }
                    },
                    {
                        label: "Travel options",
                        icon: "navigation",
                        subMenu: [{
                            label: "Plane",
                            icon: "local_airport", action() {
                                console.log("Plane")
                            },
                        }, {
                            label: "Bike",
                            icon: "directions_bike", action() {
                                console.log("Bike")
                            },
                        }]
                    },
                    {
                        isDivider: true
                    },
                    {
                        label: "Secondary action",
                        icon: "fingerprint", action() {
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
