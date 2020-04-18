import { EventManager } from "@paperbits/common/events";
import { View } from "@paperbits/common/ui";

export class ViewStack {
    private stack: View[];

    constructor(private readonly eventManager: EventManager) {
        this.stack = [];
        this.eventManager.addEventListener("onPointerDown", this.onPointerDown.bind(this));
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

        // this.stack.reverse().forEach(view => {
        //     let hit: boolean;

        //     if (view.hitTest) {
        //         hit = view.hitTest(tagetElement);
        //     }
        //     else {
        //         hit = !!this.closest(tagetElement, (node: HTMLElement) => node === view.element);
        //     }

        //     if (hit) {
        //         return;
        //     }

        //     this.stack.pop();
        //     view.close();

        // });

        // const targetReverseIndex = this.stack.reverse().findIndex(view => {
        //     if (view.hitTest) {
        //         return view.hitTest(tagetElement);
        //     }

        //     const element = this.closest(tagetElement, (node: HTMLElement) => node === view.element);

        //     return !!element;
        // });


        // const targetIndex = targetReverseIndex >= 0 ? this.stack.length - targetReverseIndex - 1 : -1;

        // while (this.stack.length > 0 && targetIndex < this.stack.length - 1) {
        //     console.log(targetIndex + " " + this.stack.length);
        //     const view = this.stack.pop();
        //     view.close();
        // }
    }

    public pushView(view: View): void {
        this.stack.push(view);
    }

    public removeView(view: View): void {
         this.stack.remove(view);
    }
}