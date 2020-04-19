import { EventManager } from "@paperbits/common/events";
import { View } from "@paperbits/common/ui";

export class ViewStack {
    private stack: View[];

    constructor(private readonly eventManager: EventManager) {
        this.stack = [];
        this.eventManager.addEventListener("onPointerDown", this.onPointerDown.bind(this));
        this.eventManager.addEventListener("onEscape", this.onEscape.bind(this));
    }

    private closest(node: Node, predicate: (node: Node) => boolean): Node {
        do {
            if (predicate(node)) {
                return node;
            }
        }
        while (node = node && node.parentNode);
    }

    private onPointerDown(event: MouseEvent): void {
        const tagetElement = <HTMLElement>event.target;
        const views = [...this.stack]; // clone array
        let nextActiveElement: HTMLElement;

        for (const view of views.reverse()) {
            let hit: boolean;

            if (view.hitTest) {
                hit = view.hitTest(tagetElement);
            }
            else {
                hit = !!this.closest(tagetElement, (node: HTMLElement) => node === view.element);
            }

            if (hit) {
                break;
            }

            this.stack.pop();
            view.close();
        }
    }

    private onEscape(): void {
        const topView = this.stack.pop();

        if (topView) {
            topView.close();

            if (topView.returnFocusTo) {
                topView.returnFocusTo.focus();
            }
        }
    }

    public pushView(view: View): void {
        this.stack.push(view);
    }

    public removeView(view: View): void {
        this.stack.remove(view);

        if (view.returnFocusTo) {
            view.returnFocusTo.focus();
        }
    }
}