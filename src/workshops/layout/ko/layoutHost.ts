import * as ko from "knockout";
import { ContentViewModelBinder, ContentViewModel } from "../../../content/ko";
import { Component, OnMounted, OnDestroyed, Param } from "@paperbits/common/ko/decorators";
import { Router, Route } from "@paperbits/common/routing";
import { EventManager } from "@paperbits/common/events";
import { ViewManager, ViewManagerMode } from "@paperbits/common/ui";
import { ILayoutService } from "@paperbits/common/layouts";


@Component({
    selector: "layout-host",
    template: "<!-- ko if: contentViewModel --><!-- ko widget: contentViewModel, grid: {} --><!-- /ko --><!-- /ko -->"
})
export class LayoutHost {
    public readonly contentViewModel: ko.Observable<ContentViewModel>;

    constructor(
        private readonly contentViewModelBinder: ContentViewModelBinder,
        private readonly router: Router,
        private readonly eventManager: EventManager,
        private readonly viewManager: ViewManager,
        private readonly layoutService: ILayoutService
    ) {
        this.contentViewModel = ko.observable();
        this.layoutKey = ko.observable();
    }

    @Param()
    public layoutKey: ko.Observable<string>;

    @OnMounted()
    public async initialize(): Promise<void> {
        await this.refreshContent();

        this.eventManager.addEventListener("onDataPush", () => this.onDataPush());
    }

    /**
     * This event occurs when data gets pushed to the storage. For example, "Undo" command restores the previous state.
     */
    private async onDataPush(): Promise<void> {
        if (this.viewManager.mode === ViewManagerMode.selecting || this.viewManager.mode === ViewManagerMode.selected) {
            await this.refreshContent();
        }
    }

    private async refreshContent(): Promise<void> {
        this.viewManager.setShutter();

        const route = this.router.getCurrentRoute();
        const bindingContext = { navigationPath: route.path, routeKind: "layout", content: null };
        const layoutContract = await this.layoutService.getLayoutByPermalink(route.path);
        const layoutContentContract = await this.layoutService.getLayoutContent(layoutContract.key);
        const contentViewModel = await this.contentViewModelBinder.getContentViewModelByKey(layoutContentContract, bindingContext);
       
        this.contentViewModel(contentViewModel);
        this.viewManager.removeShutter();
    }
}