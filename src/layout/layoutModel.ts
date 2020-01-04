import { WidgetModel } from "@paperbits/common/widgets";

/**
 * Layout model.
 */
export class LayoutModel {
    /**
     * Unique identifier.
     */
    public key: string;

    /**
     * Child nodes.
     */
    public widgets: WidgetModel[];

    constructor() {
        this.widgets = [];
    }
}
