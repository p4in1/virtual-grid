import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {VirtualGrid} from "../virtual-grid/virtual.grid.service";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent {
    title = 'my-grid';
}
