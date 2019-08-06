import * as ko from "knockout";
import template from "./locale-selector.html";
import { Component, OnMounted } from "@paperbits/common/ko/decorators";
import { IEventManager } from "@paperbits/common/events";
import { LocaleModel, ILocaleService } from "@paperbits/common/localization";

@Component({
    selector: "locale-selector",
    template: template,
    injectable: "localeSelector"
})
export class LocaleSelector {
    public readonly selectedLocale: ko.Observable<LocaleModel>;
    public readonly locales: ko.ObservableArray<LocaleModel>;

    constructor(
        private readonly eventManager: IEventManager,
        private readonly localeService: ILocaleService
    ) {
        this.selectedLocale = ko.observable();
        this.locales = ko.observableArray();
    }

    @OnMounted()
    public async initialize(): Promise<void> {
        const locales = await this.localeService.search("");
        this.locales(locales);
        this.selectLocale(locales[0]);
    }

    public selectLocale(locale: LocaleModel): void {
        this.selectedLocale(locale);
        this.eventManager.dispatchEvent("onLocaleChange", locale);
    }
}