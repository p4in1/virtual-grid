import {
    IVirtualGrid,
    IVirtualGridColumn,
    IVirtualGridRow,
} from "./interfaces/virtual.grid.interfaces";

interface IVirtualGridContextmenuEntry {
    label: string
    icon?: string
    subMenu?: IVirtualGridContextmenuEntry[]

    action?(row, col): void
}

export class VirtualGridContextmenuController {

    contextmenu: VirtualGridContextMenu

    constructor(private Grid: IVirtualGrid) {

    }

    hideMenu = (): void => {
        this.contextmenu.hide(true)
    }

    showMenu(row: IVirtualGridRow, col: IVirtualGridColumn, event) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()

        let entries = this.getEntries()
        this.Grid.domController.dom.contextmenu.innerHTML = ""
        this.contextmenu = new VirtualGridContextMenu(this.Grid, this.Grid.domController.dom.contextmenu, entries, row, col, event)

        let _clickHandler = () => {
            this.hideMenu()
            document.body.removeEventListener("click", _clickHandler)
        }

        document.body.append(this.Grid.domController.dom.contextmenu)
        document.body.addEventListener("click", _clickHandler)
    }

    getEntries(): IVirtualGridContextmenuEntry[] {
        return [{
            label: "Export",
            icon: "get_app",
            subMenu: [{
                label: "as Excel",
                action() {
                    console.log("Export as Excel")
                }
            }, {
                label: "as CSV",
                action() {
                    console.log("Export as CSV")
                }
            }, {
                label: "another submenu",
                subMenu: [{
                    label: "Help !?",
                    action() {
                        console.log("Help me :(")
                    }
                }]
            }]
        }, {
            icon: "content_copy",
            label: "Copy to clipboard",
            action() {
                console.log("copy to clipboard")
            }
        }]
    }
}

class VirtualGridContextMenu {

    top: number = 0
    left: number = 0
    height: number = 0
    width: number = 0

    isActive: boolean = true;
    isSubMenu: boolean = false
    isVisible: boolean = true

    hideDebounce;
    showDebounce;

    visibleChild: VirtualGridContextMenu

    constructor(private Grid: IVirtualGrid,
                public element: HTMLElement,
                public entries: any[],
                public row: IVirtualGridRow,
                public col: IVirtualGridColumn,
                public event: any,
                public parent?: VirtualGridContextMenu,
                private parentElement?: HTMLElement) {

        this.setStyles(event, entries, parent, parentElement)

        this.isSubMenu = !!parent

        this.generateMenu(entries, element, row, col, parent)

        for (let entry of entries) {
            if (entry.subMenu) {
                entry.subMenuElement = this.Grid.Utils.el("div", ["virtual-grid-submenu"])
                entry.subMenuinstance = new VirtualGridContextMenu(Grid, entry.subMenuElement, entry.subMenu, row, col, event, this, entry)
            }
        }
    }

    show() {
        this.showDebounce = setTimeout(() => {
            this.isVisible = true;
            this.setStyles(this.event, this.entries, this.parent, this.parentElement)

            document.body.append(this.element)
        }, 500)

    }

    hide(isInstant?) {
        this.hideDebounce = setTimeout(() => {
            this.isVisible = false

            if (this.parent) {
                this.parent.visibleChild = null
            }

            if (this.visibleChild != void 0) {
                this.visibleChild.hide(isInstant)
                this.visibleChild = null
            }

            let parent = this.parent
            while (parent) {
                if (parent.isActive) {
                    break;
                } else {
                    this.parent.hide(true)

                    parent = parent.parent
                }
            }

            this.element.parentNode && this.element.parentNode.removeChild(this.element)
        }, isInstant ? 0 : 500);

    }


    setStyles(event, entries, parent: VirtualGridContextMenu, parentElement) {
        let currentWidth = 0;
        let windowRect: ClientRect = document.body.getBoundingClientRect()
        let parentRect = parentElement ? parentElement.element.getBoundingClientRect() : null

        let overflow = "hidden"

        for (let entry of entries) {
            let _width = this.Grid.Utils.getTextWidthInPixel(entry.label)

            if (_width > currentWidth) {
                currentWidth = _width
            }
        }

        let left = event.clientX
        let top = event.clientY
        let height = entries.length * 48
        let width = currentWidth + 48

        if (left + width > windowRect.width) {
            left = windowRect.width - width - 8
        }

        if (height > windowRect.height) {
            height = windowRect.height - 16
            top = 8
            overflow = "auto"
        } else if (top + height > windowRect.height) {
            top = windowRect.height - height - 8
        }

        if (parent) {
            top = parentRect.top
            left = parent.left + parent.width

            if (left + width > windowRect.width) {
                left = parent.left - width
            }

            if (top + height > windowRect.height) {
                height = parent.height
                overflow = "auto"
            }
        }

        this.Grid.domController.setStyles(this.element, {
            top: `${this.top = top}px`,
            left: `${this.left = left}px`,
            width: `${this.width = width}px`,
            height: `${this.height = height}px`,
            overflow
        })
    }

    generateMenu(entries, element, row, col, parent) {

        entries.forEach((entry, index) => {
            entry.index = index
            entry.element = this.Grid.Utils.el("div", ["contextmenu-entry"])
            let contextmenuContent = this.Grid.Utils.el("div", ["contextmenu-entry-content"])
            let label = this.Grid.Utils.el("span", ["contextmenu-entry-label"])
            let icon = this.Grid.Utils.el("i", ["contextmenu-entry-icon", "virtual-material-icons", "small"])

            icon.innerText = entry.icon
            label.textContent = entry.label

            if (entry.action) {
                entry.element.addEventListener("click", () => {
                    entry.action(row, col)
                })
            }

            contextmenuContent.append(icon, label)
            entry.element.append(contextmenuContent)
            element.append(entry.element)

            if (entry.subMenu) {
                let caret = this.Grid.Utils.el("i", ["contextmenu-entry-icon", "virtual-material-icons", "extra-small"])

                caret.innerText = "play_arrow"

                entry.element.append(caret)
                entry.element.addEventListener("mouseenter", () => {
                    clearTimeout(this.hideDebounce)

                    entry.subMenuinstance.show()

                    this.visibleChild = entry.subMenuinstance
                })

                entry.element.addEventListener("mouseleave", () => {
                    clearTimeout(this.hideDebounce)

                    if (entry.subMenuinstance) {
                        clearTimeout(entry.subMenuinstance.showDebounce)
                    }

                    if (entry.subMenuinstance.isVisible) {
                        entry.subMenuinstance.hide()
                    }
                })
            }
        })

        if (parent) {
            element.addEventListener("mouseenter", () => {
                this.isActive = true
                clearTimeout(parent.hideDebounce)
                clearTimeout(this.hideDebounce)
            })

            element.addEventListener("mouseleave", () => {
                this.isActive = false
                clearTimeout(this.hideDebounce)
                this.hide()
            })
        }
    }
}
