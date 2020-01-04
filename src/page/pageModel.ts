import { WidgetModel } from "@paperbits/common/widgets/widgetModel";

export class PageModel {
    public key: string;
    public widgets: WidgetModel[];

    constructor() {
        this.widgets = [];
    }
}
