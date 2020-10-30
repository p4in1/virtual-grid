import {IVirtualGridColumn, IVirtualGridRow} from "./interfaces/virtual.grid.interfaces";

export class VirtualGridUtils {
    CHAR_WIDTH_MAP = {};
    DEFAULT_CHAR = 'M';

    gIsTouchDevice = false;
    gIsPhone = false;

    constructor() {
        const textWidthInspector: HTMLElement = document.createElement("span");

        document.body.append(textWidthInspector);

        textWidthInspector.style.fontSize = "14px"
        textWidthInspector.style.fontFamily = "'Roboto', sans-serif"

        const PRINT_CHARS = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',
            'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ü',
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U',
            'V', 'W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ü', 'ß', " ",
            '!', '"', '§', '$', '%', '&', '/', '\\', '(', ')', '[', ']', '{', '}', '=', '?',
            '.', ':', '-', '_', ',', ';', '#', '\'', '+', '*', '~', '<', '>', '|', '@', '€',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        // calculate the chars width
        for (const i in PRINT_CHARS) {
            const char = PRINT_CHARS[i];
            textWidthInspector.textContent = char;
            let charWidth = textWidthInspector.offsetWidth;
            if (charWidth < 6) {
                charWidth = 6;
            }

            this.CHAR_WIDTH_MAP[char] = charWidth;
        }

        textWidthInspector.remove();

        this.gIsTouchDevice = this.checkIsTouchDevice();
        this.gIsPhone = this.checkIsPhone();
    }

    public getTextWidthInPixel(string): number {
        let lengthInPixel = 0;
        for (let i = 0; i < string.length; i++) {
            let charWidth = this.CHAR_WIDTH_MAP[string[i]];

            if (charWidth == void 0) {
                charWidth = this.CHAR_WIDTH_MAP[this.DEFAULT_CHAR];
            }

            lengthInPixel += charWidth;
        }

        return lengthInPixel;
    }

    public isPhone(): boolean {
        return this.gIsPhone;
    }

    /**
     * Are we running on a touch device
     * @return {boolean} - true if true we run on a touch device otherwise false
     */
    public checkIsTouchDevice(): boolean {
        return (('ontouchstart' in window as boolean) || // html5 browsers
            (window.navigator.maxTouchPoints > 0) || // future IE
            (window.navigator.msMaxTouchPoints > 0) ||
            window.matchMedia('(pointer: coarse)').matches); // https://developer.mozilla.org/de/docs/Web/CSS/@media/pointer
    }

    /**
     * Are we running on a phone device
     * @return {boolean} - true if true we run on a phone device otherwise false
     */
    public checkIsPhone(): boolean {
        const isPhoneWidth: boolean = (
            (window.matchMedia('(min-width:320px) and (max-width: 420px) and (orientation: portrait)')).matches ||
            (window.matchMedia('(min-height:320px) and (max-height: 420px) and (orientation: landscape)')).matches
        );
        return this.isTouchDevice() && isPhoneWidth;
    }

    /**
     * Determine if the current device is a touch device.
     *
     * @access public
     * @return {boolean} - True if it is a touch device, otherwise false.
     */
    public isTouchDevice(): boolean {
        return this.gIsTouchDevice;
    }

    public el(tagName: string, classes: string[] = [], attributes: any = {}) {
        let node = document.createElement(tagName);

        for (let c of classes) {
            node.classList.add(c)
        }

        for (let i in attributes) {
            node.setAttribute(i, attributes[i])
        }

        return node;
    }

    /**
     * flatten the recursive structure of the tree and transform it to a list
     * @param rows - recursive tree structure or just a plain list
     */
    public flatten = (rows: any[]): any[] => {

        let listFragment: any[] = [];

        for (const row of rows) {

            listFragment.push(row);

            if (row.children) {

                const childListFragment: any[] = this.flatten(row.children);

                childListFragment.forEach((childItem) => {
                    listFragment.push(childItem)
                });
            }
        }

        return listFragment;
    };

    /**
     * check if the given "something" is a number or can be parsed into one
     * @param value
     */
    isValidNumber(value: any) {
        return !isNaN(value) && value !== ""
    }

    /**
     * check if the given "something" is a date or can be parsed into one
     * @param d
     */
    isValidDate(d: any) {
        let date = new Date(d)
        return date instanceof Date && !isNaN(+date);
    }

    /**
     * returns the date as a string in the current format or an empty string
     * @param d
     */
    parseDate(d): string {
        let isValid = this.isValidDate(d)

        if (isValid) {
            return this.getDate(d)
        } else {
            return ""
        }
    }

    /**
     * returns the given date as a string in the current format
     * @param d
     */
    getDate = (d): string => {
        let date = new Date(d);
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        return this.to2digit(day) + '.' + this.to2digit(month) + '.' + year
    };

    /**
     * pads numbers with one leading zero ( date formats etc.)
     * @param n
     */
    to2digit = (n: number): string => {
        return ('00' + n).slice(-2);
    }

    /**
     * generates a unique identifier
     */
    generateUUID = (): string => {
        return (`${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`).replace(/[018]/g, (c: any) =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    toggleClass = (elementClass: string, element: HTMLElement, setClass: boolean): void => {
        setClass ? element.classList.add(elementClass) : element.classList.remove(elementClass)
    }

    copyToClipboard(text) {

        let textArea: any = document.createElement("textarea");

        // Place in top-left corner of screen regardless of scroll position.
        textArea.style.position = 'absolute';
        textArea.style.top = "-2000px";
        textArea.style.left = "-2000px";

        // Ensure it has a small width and height. Setting to 1px / 1em
        // doesn't work as this gives a negative w/h on some browsers.
        textArea.style.width = '2em';
        textArea.style.height = '2em';

        // We don't need padding, reducing the size if it does flash render.
        textArea.style.padding = "0px";

        // Clean up any borders.
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';

        // Avoid flash of white box if rendered for any reason.
        textArea.style.background = 'transparent';

        textArea.value = text;

        document.body.appendChild(textArea);

        setTimeout(() => {
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, 99999);
            try {
                let successful = document.execCommand('copy');
                let msg = successful ? 'successful' : 'unsuccessful';
                console.log('Fallback: Copying text command was ' + msg);
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }

            document.body.removeChild(textArea);
        })
    }
}
