import * as ko from "knockout";
import template from "./mediaSelector.html";
import * as Utils from "@paperbits/common/utils";
import { MediaItem } from "./mediaItem";
import { IMediaService, IMediaFilter, MediaContract } from "@paperbits/common/media";
import { IViewManager } from "@paperbits/common/ui";
import { IEventManager } from "@paperbits/common/events";
import { Component, Param, Event, OnMounted } from "@paperbits/common/ko/decorators";
import { IWidgetService } from "@paperbits/common/widgets";

@Component({
    selector: "media-selector",
    template: template,
    injectable: "mediaSelector"
})
export class MediaSelector {
    public readonly searchPattern: KnockoutObservable<string>;
    public readonly mediaItems: KnockoutObservableArray<MediaItem>;
    public readonly working: KnockoutObservable<boolean>;

    @Param()
    public selectedMedia: KnockoutObservable<MediaItem>;

    @Param()
    public mediaFilter: IMediaFilter;

    @Event()
    public onSelect: (media: MediaContract) => void;
  
    constructor(
        private readonly eventManager: IEventManager,
        private readonly mediaService: IMediaService,
        private readonly viewManager: IViewManager,
        private readonly widgetService: IWidgetService
    ) {
        this.onMounted = this.onMounted.bind(this);
        this.selectMedia = this.selectMedia.bind(this);

        // setting up...
        this.mediaItems = ko.observableArray<MediaItem>();
        this.selectedMedia = ko.observable<MediaItem>();
        this.searchPattern = ko.observable<string>();
        this.searchPattern.subscribe(this.searchMedia);
        this.working = ko.observable(true);

        this.searchMedia();
    }

    @OnMounted()
    public onMounted(): void {
        this.searchMedia();
    }

    public async searchMedia(searchPattern: string = ""): Promise<void> {
        this.working(true);

        let mediaFiles;

        if (this.mediaFilter) {
            mediaFiles = await this.mediaService.searchByProperties(this.mediaFilter.propertyNames, this.mediaFilter.propertyValue, this.mediaFilter.startSearch);
        }
        else {
            mediaFiles = await this.mediaService.search(searchPattern);
        }

        const mediaItems = mediaFiles.map(media => new MediaItem(media));
        this.mediaItems(mediaItems);
        this.working(false);
    }

    public async selectMedia(media: MediaItem): Promise<void> {
        this.selectedMedia(media);
        this.onSelect(media.toMedia());
    }

    public onMediaUploaded(): void {
        this.searchMedia();
    }

    public async uploadMedia(): Promise<void> {
        const files = await this.viewManager.openUploadDialog();

        this.working(true);

        const uploadPromises = [];

        for (const file of files) {
            const content = await Utils.readFileAsByteArray(file);
            const uploadPromise = this.mediaService.createMedia(file.name, content, file.type);

            this.viewManager.addPromiseProgressIndicator(uploadPromise, "Media library", `Uploading ${file.name}...`);
            uploadPromises.push(uploadPromise);
        }

        await Promise.all(uploadPromises);
        await this.searchMedia();
        this.working(false);
    }

    public onDragStart(item: MediaItem): HTMLElement {
        item.widgetFactoryResult = item.widgetOrder.createWidget();

        const widgetElement = item.widgetFactoryResult.element;
        const widgetModel = item.widgetFactoryResult.widgetModel;
        const widgetBinding = item.widgetFactoryResult.widgetBinding;

        this.viewManager.beginDrag({
            type: "widget",
            sourceModel: widgetModel,
            sourceBinding: widgetBinding
        });

        return widgetElement;
    }

    public onDragEnd(item: MediaItem): void {
        item.widgetFactoryResult.element.remove();
        const dragSession = this.viewManager.getDragSession();
        const acceptorBinding = dragSession.targetBinding;

        if (acceptorBinding && acceptorBinding.handler) {
            const widgetHandler = this.widgetService.getWidgetHandler(acceptorBinding.handler);
            widgetHandler.onDragDrop(dragSession);
        }

        this.eventManager.dispatchEvent("virtualDragEnd");
    }
}