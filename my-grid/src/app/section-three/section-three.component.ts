import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {IVirtualGridConfig} from "../../virtual-grid/interfaces/virtual.grid.interfaces";
import {VirtualGrid} from "../../virtual-grid/virtual.grid.service";

@Component({
    selector: 'app-section-three',
    templateUrl: './section-three.component.html',
    styleUrls: ['./section-three.component.scss']
})
export class SectionThreeComponent implements OnInit, AfterViewInit {
    gridInstance

    @ViewChild("grid") grid: ElementRef

    constructor() {
    }

    ngOnInit(): void {
    }

    ngAfterViewInit() {


        fetch('assets/data.json').then(response => response.json()).then((data) => {

            let items = []

            // for (let i = 0; i < 100; i++) {
                data.rows.forEach((item) => {
                    items.push(item)
                })
            // }

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
                        type: "text"
                    },
                    {
                        field: "data.user.userLastName",
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
                        title: "Forderungs Datum"
                    }
                ],
                element: this.grid.nativeElement,
                showHeader: true,
                showGroupPanel: true,
                selectionMethod: "multi"
            }

            this.gridInstance = new VirtualGrid(config)

            window["grid"] = this.gridInstance
        })

    }
}
