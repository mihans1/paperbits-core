import * as Objects from "@paperbits/common/objects";
import { Bag, Contract } from "@paperbits/common";
import { ContentViewModel } from "./contentViewModel";
import { ViewModelBinder } from "@paperbits/common/widgets";
import { ContentModel } from "../contentModel";
import { ViewModelBinderSelector } from "../../ko/viewModelBinderSelector";
import { ContentHandlers } from "../contentHandlers";
import { IWidgetBinding } from "@paperbits/common/editing";
import { PlaceholderViewModel } from "../../placeholder/ko";
import { ContentModelBinder } from "..";


export class ContentViewModelBinder implements ViewModelBinder<ContentModel, ContentViewModel> {
    constructor(
        private readonly viewModelBinderSelector: ViewModelBinderSelector,
        private readonly contentModelBinder: ContentModelBinder<ContentModel>
    ) { }

    public createBinding(model: ContentModel, viewModel: ContentViewModel): void {
        const binding: IWidgetBinding<ContentModel> = {
            displayName: "Content",
            readonly: false,
            name: "content",
            model: model,
            handler: ContentHandlers,
            provides: ["static", "scripts", "keyboard"]
        };

        viewModel["widgetBinding"] = binding;
    }

    public async modelToViewModel(model: ContentModel, viewModel?: ContentViewModel, bindingContext?: Bag<any>): Promise<ContentViewModel> {
        if (!viewModel) {
            viewModel = new ContentViewModel();
        }

        let childBindingContext: Bag<any> = {};
        let layoutEditing = false;

        if (bindingContext) {
            childBindingContext = <Bag<any>>Objects.clone(bindingContext);
            layoutEditing = !!(bindingContext?.routeKind === "layout");

            childBindingContext.readonly = layoutEditing;
        }

        const viewModels = [];

        for (const widgetModel of model.widgets) {
            const widgetViewModelBinder = this.viewModelBinderSelector.getViewModelBinderByModel(widgetModel);
            const widgetViewModel = await widgetViewModelBinder.modelToViewModel(widgetModel, null, childBindingContext);

            viewModels.push(widgetViewModel);
        }

        if (viewModels.length === 0) {
            const placeholderViewModel = new PlaceholderViewModel("Content");
            viewModels.push(placeholderViewModel);
        }

        viewModel.widgets(viewModels);

        if (!viewModel["widgetBinding"]) {
            this.createBinding(model, viewModel);
        }

        return viewModel;
    }

    public canHandleModel(model: ContentModel): boolean {
        return model instanceof ContentModel;
    }

    public async getContentViewModelByKey(contentContract: Contract, bindingContext: any): Promise<any> {
        const layoutModel = await this.contentModelBinder.contractToModel(contentContract, bindingContext);
        const layoutViewModel = this.modelToViewModel(layoutModel, null, bindingContext);

        return layoutViewModel;
    }
}