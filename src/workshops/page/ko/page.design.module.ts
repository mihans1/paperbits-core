import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { PagesWorkshop } from "./pages";
import { PageDetailsWorkshop } from "./pageDetails";
import { PageSelector } from "./pageSelector";
import { PageHyperlinkProvider } from "@paperbits/common/pages";
import { PageHost } from "./pageHost";
import { PageEditorModule } from "../../../page/ko";
import { PagesToolButton } from "./pagesToolButton";


export class PageDesignModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bind("pageHost", PageHost);
        injector.bind("pagesWorkshop", PagesWorkshop);
        injector.bind("pageDetailsWorkshop", PageDetailsWorkshop);
        injector.bind("pageSelector", PageSelector);
        injector.bindToCollection("hyperlinkProviders", PageHyperlinkProvider);
        injector.bindToCollection("workshopSections", PagesToolButton);
        injector.bind("pageHyperlinkProvider", PageHyperlinkProvider);
        injector.bindModule(new PageEditorModule());
    }
}