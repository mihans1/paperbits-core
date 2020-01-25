import * as ko from "knockout";
import { Component, OnMounted, OnDestroyed, Param } from "@paperbits/common/ko/decorators";
import { Router, Route } from "@paperbits/common/routing";
import { EventManager } from "@paperbits/common/events";
import { ViewManager, ViewManagerMode } from "@paperbits/common/ui";
import { ContentViewModelBinder, ContentViewModel } from "../../../content/ko";
import { ILayoutService } from "@paperbits/common/layouts";
import { IBlogService } from "@paperbits/common/blogs";


@Component({
    selector: "blog-post-host",
    template: "<!-- ko if: contentViewModel --><!-- ko widget: contentViewModel, grid: {} --><!-- /ko --><!-- /ko -->"
})
export class BlogHost {
    private savingTimeout;
    public readonly contentViewModel: ko.Observable<ContentViewModel>;

    constructor(
        private readonly contentViewModelBinder: ContentViewModelBinder,
        private readonly router: Router,
        private readonly eventManager: EventManager,
        private readonly viewManager: ViewManager,
        private readonly layoutService: ILayoutService,
        private readonly blogService: IBlogService
    ) {
        this.contentViewModel = ko.observable();
        this.blogPostKey = ko.observable();
    }

    @Param()
    public blogPostKey: ko.Observable<string>;

    @OnMounted()
    public async initialize(): Promise<void> {
        await this.refreshContent();

        this.router.addRouteChangeListener(this.onRouteChange);
        this.eventManager.addEventListener("onDataPush", () => this.onDataPush());


        this.eventManager.addEventListener("onContentUpdate", this.scheduleUpdate);
    }

    private async updateContent(): Promise<void> {
        console.log("UPD");

        // if (!bindingContext || !bindingContext.navigationPath) {
        //     return;
        // }

        // const contentContract = {
        //     type: "page",
        //     nodes: []
        // };

        // model.widgets.forEach(section => {
        //     const modelBinder = this.modelBinderSelector.getModelBinderByModel(section);
        //     contentContract.nodes.push(modelBinder.modelToContract(section));
        // });

        // await this.pageService.updatePageContent(model.key, contentContract);
    }

    private async scheduleUpdate(): Promise<void> {
        clearTimeout(this.savingTimeout);
        this.savingTimeout = setTimeout(this.updateContent, 600);
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
        const postContract = await this.blogService.getBlogPostByPermalink(route.path);
        const postContentContract = await this.blogService.getBlogPostContent(postContract.key);

        const bindingContext = {
            navigationPath: route.path,
            routeKind: "blog-post",
            content: postContentContract
        };

        const layoutContract = await this.layoutService.getLayoutByPermalink(route.path);
        const layoutContentContract = await this.layoutService.getLayoutContent(layoutContract.key);
        const contentViewModel = await this.contentViewModelBinder.getContentViewModelByKey(layoutContentContract, bindingContext);

        this.contentViewModel(contentViewModel);

        this.viewManager.removeShutter();
    }

    private async onRouteChange(route: Route): Promise<void> {
        if (route.previous && route.previous.path === route.path && route.previous.metadata["routeKind"] === route.metadata["routeKind"]) {
            return;
        }

        await this.refreshContent();
    }

    @OnDestroyed()
    public dispose(): void {
        this.router.removeRouteChangeListener(this.onRouteChange);
        this.eventManager.removeEventListener("onContentUpdate", this.scheduleUpdate);
    }
}