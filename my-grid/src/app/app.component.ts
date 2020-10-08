import {Component, ViewEncapsulation} from '@angular/core';
import {VirtualGrid} from "../virtual-grid/virtual.grid.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  title = 'my-grid';

  gridInstance

  constructor() {

    fetch('assets/data.json').then(response => response.json()).then((data) => {
      let config = {
        style: "virtual-material",
        width: '100%',
        rows: data.rows,
        columns: data.columns,
        element: document.getElementById("grid-demo"),
        showHeader: true,
        showColumnFilter: true,
        onRowClick: this.rowClick,
        onRowDoubleClick: this.rowDoubleClick,
        onRowRightClick: this.rowRightClick
        // onGridReady: (grid) => {
        //     let config = localStorage.getItem(this.currentRoute)
        //     if (config) {
        //         config = JSON.parse(config)
        //         grid.api.setConfig(config)
        //     }
        // }
      }

      this.gridInstance = new VirtualGrid(config)
    });


  }

  filter(event) {
    this.gridInstance.api.setFilter(event.target.value)
  }

  rowClick = () => {
    console.log("click")
  }
  rowDoubleClick = () => {
    console.log("double click")
  }
  rowRightClick = () => {
    console.log("right click")
  }
}
