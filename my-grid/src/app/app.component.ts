import {Component, ViewEncapsulation} from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent {
    title = 'my-grid';
    data
    isReady
    constructor() {
        fetch('assets/data.json').then(response => response.json()).then((data) => {
            this.data = data
            this.isReady = true
        });
    }
}
