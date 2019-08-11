import * as ko from "knockout";
import template from "./locale-editor.html";
import { Component, OnMounted, Param, Event } from "@paperbits/common/ko/decorators";
import { LocaleModel } from "@paperbits/common/localization";

@Component({
    selector: "locale-editor",
    template: template,
    injectable: "localeEditor"
})
export class LocaleEditor {
    public readonly code: ko.Observable<string>;
    public readonly displayName: ko.Observable<string>;

    constructor() {
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
        this.displayName.subscribe(this.applyChanges);
    }

    public applyChanges(): void {
        this.locale.code = this.code();
        this.locale.displayName = this.displayName();
        this.onChange(this.locale);
    }
}