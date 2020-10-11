import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {VirtualGrid} from "../../virtual-grid/virtual.grid.service";
import {IVirtualGridConfig} from "../../virtual-grid/interfaces/virtual.grid.interfaces";

@Component({
    selector: 'app-section-two',
    templateUrl: './section-two.component.html',
    styleUrls: ['./section-two.component.scss']
})
export class SectionTwoComponent implements AfterViewInit {
    @ViewChild("grid") grid: ElementRef

    gridInstance

    constructor() {
    }

    ngAfterViewInit() {

        //
        // this.gridInstance = new VirtualGrid(config)


        fetch('assets/data.json').then(response => response.json()).then((data) => {

            let map: any = {}

            let tree = []

            for (let item of data.rows) {
                let user = item.data.user
                let groups = user.groups

                for (let g of groups) {
                    if (map[g._id] == void 0) {
                        map[g._id] = g
                    }
                }
            }

            for (let item in map) {
                let group = map[item]

                if (!group.parent) {
                    tree.push(group)
                }

                if (group.parent && map[group.parent]) {
                    if (map[group.parent].children == void 0) {
                        map[group.parent].children = []
                    }

                    map[group.parent].children.push(group)
                }
            }

            for (let item in map) {
                let group = map[item]
                if (group.parent && group.children == void 0) {
                    group.isLeaf = true
                    group.children = []
                }
            }

            for (let item of data.rows) {
                let user = item.data.user
                let groups = user.groups

                for (let g of groups) {
                    if (map[g._id].isLeaf) {
                        map[g._id].children.push({
                            title: `${user.userFirstName} ${user.userLastName}`,
                            userFirstName: user.userFirstName,
                            userLastName: user.userLastName,
                            email: user.email
                        })
                    }
                }
            }

            console.log(tree)

            let config: IVirtualGridConfig = {
                rows: tree,
                columns: [
                    {
                        type: "avatar",
                        avatarConfig: {
                            url: "data.user.avatarURL",
                            placeholderAgg: ["userFirstName", "userLastName"],
                            placeholderBgColor: "var(--color-primary)",
                            hideEmptyPlaceholder: true
                        },
                    },
                    {
                        field: "title",
                        title: "Gruppenstruktur",
                        isHierarchyColumn: true
                    },
                    {
                        field: "email",
                        title: "Email",
                        showFilter: false
                    }
                ],
                element: this.grid.nativeElement,
                showHeader: true,
                showColumnFilter: true,
                deselectWhenCollapse: true,
                selectionMethod: "multi"
            }

            this.gridInstance = new VirtualGrid(config)
        })

    }

}
