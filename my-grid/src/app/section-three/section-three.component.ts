import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {
    IValueFormatterParams,
    IVirtualGrid,
    IVirtualGridConfig,
    IVirtualGridContextmenuEntry,
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
                    title: "Auszahlung gefordert"
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
                    field: "integer1",
                    title: "Integer",
                    type: "number",
                    aggFunc: "min",
                    aggregateRowGroups: true,
                },
                {
                    field: "integer2",
                    title: "Integer",
                    type: "number",
                    aggFunc: "max",
                    aggregateRowGroups: true,
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
                    actions: [{
                        icon: "delete", color: "red", callback: () => {

                        }
                    }]
                }
            ],
            element: this.grid.nativeElement,
            showHeader: true,
            showGroupPanel: false,
            showColumnFilter: true,
            showColumnAggregation: true,
            useMultiselect: true,
            useRangeSelect: true,
            suppressContextmenu: false,
            suppressContextmenuDefault: false,
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
