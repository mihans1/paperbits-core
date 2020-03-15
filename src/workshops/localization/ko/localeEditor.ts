import * as ko from "knockout";
import template from "./localeEditor.html";
import { Component, OnMounted, Param, Event } from "@paperbits/common/ko/decorators";
import { LocaleModel, LocaleService } from "@paperbits/common/localization";
import { builtInLocales } from "../locales";

@Component({
    selector: "locale-editor",
    template: template,
    injectable: "localeEditor"
})
export class LocaleEditor {
    public readonly languages: ko.Observable<any>;
    public readonly selectedLanguage: ko.Observable<any>;
    public readonly locales: ko.Observable<any>;
    public readonly selectedLocale: ko.Observable<any>;

    constructor(private readonly localeService: LocaleService) {
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
    }

    @Param()
    public locale: LocaleModel;

    @Event()
    public onChange: (model: LocaleModel) => void;

    @OnMounted()
    public async initialize(): Promise<void> {
        this.selectedLanguage.subscribe(language => {
            this.locales(null);
            this.selectedLocale(null);

            if (!language.language.locales) {
                return;
            }

            this.locales(Object.keys(language.language.locales).map(x => {
                return {
                    code: x,
                    displayName: language.language.locales[x].nameNative
                };
            }));
        });
    }

    public addLocale(): void {
        const language = this.selectedLanguage();
        const locale = this.selectedLocale();

        let code = language.code;
        let displayName = language.displayName;

        if (locale) {
            code += "-" + locale.code;
            displayName += ` (${locale.displayName})`;
        }

        debugger;

        // this.localeService.createLocale(code, displayName);
    }
}