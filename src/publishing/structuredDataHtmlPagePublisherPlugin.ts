import { ISiteService } from "@paperbits/common/sites";
import { HtmlPagePublisherPlugin, HtmlPage } from "@paperbits/common/publishing";

export class StructuredDataHtmlPagePublisherPlugin implements HtmlPagePublisherPlugin {
    constructor(private readonly siteService: ISiteService) { }

    public async apply(document: Document, page: HtmlPage): Promise<void> {
        let structuredDataObject: any =  page.structuredData;

        /* Ensure rendering structured data for home page only */
        if (page.permalink !== "/" && !structuredDataObject) {
            return;
        }
        
        if (!structuredDataObject) {
            const settings = await this.siteService.getSiteSettings();

            structuredDataObject = {
                "@context": "http://www.schema.org",
                "@type": "Organization",
                "name": settings.site.title,
                "description": settings.site.description
            };
        }

        const structuredDataScriptElement = document.createElement("script");
        structuredDataScriptElement.setAttribute("type", "application/ld+json");
        structuredDataScriptElement.innerHTML = JSON.stringify(structuredDataObject);
        document.head.appendChild(structuredDataScriptElement);
    }
}
