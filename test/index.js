import {VirtualGrid} from "../dist/virtual.grid.min.js";

(() => {
    let globalFilter = document.getElementById("global-filter")
    let gridInstance;
    globalFilter.addEventListener("input", () => {
        gridInstance.api.setFilter(globalFilter.value)
    })

    fetch('data.json').then(response => response.json()).then((data) => {
        let config = {
            style: "virtual-material",
            width: '100%',
            rows: data.rows,
            columns: data.columns,
            element: document.getElementById("grid-demo"),
            showHeader: true,
            showColumnFilter: true,
            onRowClick: rowClick,
            onRowDoubleClick: rowDoubleClick,
            onRowRightClick: rowRightClick
            // onGridReady: (grid) => {
            //     let config = localStorage.getItem(this.currentRoute)
            //     if (config) {
            //         config = JSON.parse(config)
            //         grid.api.setConfig(config)
            //     }
            // }
        }

        gridInstance = new VirtualGrid(config)
    });

    function rowRightClick() {

    }

    function rowDoubleClick() {

    }

    function rowClick() {

    }
})()
