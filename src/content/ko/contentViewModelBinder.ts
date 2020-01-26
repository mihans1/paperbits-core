import * as Objects from "@paperbits/common/objects";
import { Bag, Contract } from "@paperbits/common";
import { ContentViewModel } from "./contentViewModel";
import { ViewModelBinder, ModelBinderSelector } from "@paperbits/common/widgets";
import { ContentModel } from "../contentModel";
import { ViewModelBinderSelector } from "../../ko/viewModelBinderSelector";
import { ContentHandlers } from "../contentHandlers";
import { IWidgetBinding } from "@paperbits/common/editing";
import { PlaceholderViewModel } from "../../placeholder/ko";
import { ContentModelBinder } from "..";
import { EventManager } from "@paperbits/common/events";


export class ContentViewModelBinder implements ViewModelBinder<ContentModel, ContentViewModel> {
    constructor(
        private readonly viewModelBinderSelector: ViewModelBinderSelector,
        private readonly contentModelBinder: ContentModelBinder<ContentModel>,
        private readonly modelBinderSelector: ModelBinderSelector,
        private readonly eventManager: EventManager
    ) { }

    public createBinding(model: ContentModel, viewModel: ContentViewModel, bindingContext: Bag<any>): void {
        let savingTimeout;

        const updateContent = async (): Promise<void> => {
            const contentContract = {
                type: "page",
                nodes: []
            };

            model.widgets.forEach(section => {
                const modelBinder = this.modelBinderSelector.getModelBinderByModel(section);
                contentContract.nodes.push(modelBinder.modelToContract(section));
            });

            if (bindingContext?.onContentUpdate) {
                bindingContext.onContentUpdate(contentContract);
            }
        };

        const scheduleUpdate = async (): Promise<void> => {
            clearTimeout(savingTimeout);
            savingTimeout = setTimeout(updateContent, 600);
        };

        const binding: IWidgetBinding<ContentModel> = {
            displayName: "Content",
            readonly: false,
            name: "page",
            model: model,
            handler: ContentHandlers,
            provides: ["static", "scripts", "keyboard"],
            applyChanges: async () => await this.modelToViewModel(model, viewModel, bindingContext),
            onCreate: () => {
                if (model.type === bindingContext.update) {
                    this.eventManager.addEventListener("onContentUpdate", scheduleUpdate);
                }
            },
            onDispose: () => {
                if (model.type === bindingContext.update) {
                    this.eventManager.removeEventListener("onContentUpdate", scheduleUpdate);
                }
            }
        };

        viewModel["widgetBinding"] = binding;
    }

    public async modelToViewModel(model: ContentModel, viewModel?: ContentViewModel, bindingContext?: Bag<any>): Promise<ContentViewModel> {
        if (!viewModel) {
            viewModel = new ContentViewModel();
        }

        let childBindingContext: Bag<any> = {};

        if (bindingContext) {
            childBindingContext = <Bag<any>>Objects.clone(bindingContext);
            childBindingContext.readonly = model.type !== bindingContext.update;
            childBindingContext.onContentUpdate = bindingContext.onContentUpdate;
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
            this.createBinding(model, viewModel, bindingContext);
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