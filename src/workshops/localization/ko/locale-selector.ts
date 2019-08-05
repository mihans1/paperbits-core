import * as ko from "knockout";
import template from "./locale-selector.html";
import { Component } from "@paperbits/common/ko/decorators";
import { IEventManager } from "@paperbits/common/events";
import { LocaleModel } from "@paperbits/common/localization";

@Component({
    selector: "locale-selector",
    template: template,
    injectable: "localeSelector"
})
export class LocaleSelector {
    public readonly selectedLocale: ko.Observable<LocaleModel>;
    public readonly locales: ko.ObservableArray<LocaleModel>;

    constructor(private readonly eventManager: IEventManager) {
        const locale = new LocaleModel();
        locale.code = "en-US";
        locale.displayName = "English (US)";

        this.selectedLocale = ko.observable(locale);
        this.locales = ko.observableArray();
        this.locales.push(locale);
    }

    public selectLocale(locale: LocaleModel): void {
        this.selectedLocale(locale);
        this.eventManager.dispatchEvent("onLocaleChange", locale);
    }
}