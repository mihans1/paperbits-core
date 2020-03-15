import * as ko from "knockout";
import template from "./localeEditor.html";
import { Component, OnMounted, Param, Event } from "@paperbits/common/ko/decorators";
import { LocaleModel } from "@paperbits/common/localization";
import { builtInLocales } from "../locales";

@Component({
    selector: "locale-editor",
    template: template,
    injectable: "localeEditor"
})
export class LocaleEditor {
    public readonly code: ko.Observable<string>;
    public readonly displayName: ko.Observable<string>;

    public readonly languages: ko.Observable<any>;
    public readonly selectedLanguage: ko.Observable<any>;
    public readonly locales: ko.Observable<any>;
    public readonly selectedLocale: ko.Observable<any>;

    constructor() {
        this.selectedLanguage = ko.observable();
        this.selectedLocale = ko.observable();

        this.locales = ko.observableArray();
        this.languages = ko.observable<any>(Object.keys(builtInLocales).map(x => {
            return {
                code: x,
                language: builtInLocales[x],
                displayName: builtInLocales[x].nameNative
            };
        }));

        this.code = ko.observable<string>();
        this.displayName = ko.observable<string>();
    }

    @Param()
    public locale: LocaleModel;

    @Event()
    public onChange: (model: LocaleModel) => void;

    @OnMounted()
    public async initialize(): Promise<void> {
        this.code.subscribe(this.applyChanges);

        this.selectedLanguage.subscribe(language => {
            if (!language.language.locales) {
                this.locales(null);
                return;
            }

            this.locales(Object.keys(language.language.locales).map(x => {
                return {
                    code: x,
                    displayName: language.language.locales[x].nameNative
                };
            }));
        });

        this.displayName.subscribe(this.applyChanges);
    }

    public applyChanges(): void {
        this.locale.code = this.code();
        this.locale.displayName = this.displayName();
        this.onChange(this.locale);
    }
}