import * as Utils from "@paperbits/common/utils";
import { IPublisher, HtmlPage, HtmlPagePublisher } from "@paperbits/common/publishing";
import { IBlobStorage } from "@paperbits/common/persistence";
import { IPageService, PageContract } from "@paperbits/common/pages";
import { ISiteService } from "@paperbits/common/sites";
import { SitemapBuilder } from "./sitemapBuilder";
import { Logger } from "@paperbits/common/logging";
import { ILocaleService } from "@paperbits/common/localization";


export class PagePublisher implements IPublisher {
    constructor(
        private readonly pageService: IPageService,
        private readonly siteService: ISiteService,
        private readonly outputBlobStorage: IBlobStorage,
        private readonly htmlPagePublisher: HtmlPagePublisher,
        private readonly localeService: ILocaleService,
        private readonly logger: Logger
    ) { }

    public async renderPage(page: HtmlPage): Promise<string> {
        this.logger.traceEvent(`Publishing page ${page.title}...`);

        const htmlContent = await this.htmlPagePublisher.renderHtml(page);
        return "<!DOCTYPE html>" + htmlContent;
    }

    private async renderAndUpload(settings: any, page: PageContract, locale: string): Promise<void> {

        const htmlPage: HtmlPage = {
            title: [page.title, settings.site.title].join(" - "),
            description: page.description || settings.site.description,
            keywords: page.keywords || settings.site.keywords,
            permalink: page.permalink,
            author: settings.site.author,
            openGraph: {
                type: page.permalink === "/" ? "website" : "article",
                title: page.title,
                description: page.description || settings.site.description,
                url: page.permalink,
                siteName: settings.site.title
                // image: { ... }
            }
        };

        const htmlContent = await this.renderPage(htmlPage);

        let permalink = page.permalink;

        const regex = /\/[\w]+\.html$/gm;
        const isHtmlFile = regex.test(permalink);

        if (!isHtmlFile) {
            /* if filename has no *.html extension we publish it to a dedicated folder with index.html */
            permalink = `${permalink}/index.html`;
        }

        const localePrefix = locale ? `/${locale}` : "";
        const uploadPath = `${localePrefix}${permalink}`;
        const contentBytes = Utils.stringToUnit8Array(htmlContent);

        await this.outputBlobStorage.uploadBlob(uploadPath, contentBytes, "text/html");
    }

    public async publish(): Promise<void> {
        const locales = await this.localeService.getLocales();
        // const localizationEnabled = locales.length > 1;

        for (const locale of locales) {
            try {
                const pages = await this.pageService.search("", locale.code);
                const results = [];
                const settings = await this.siteService.getSiteSettings();
                const sitemapBuilder = new SitemapBuilder(settings.site.hostname);

                for (const page of pages) {
                    results.push(this.renderAndUpload(settings, page, locale.code));
                    sitemapBuilder.appendPermalink(page.permalink); // TODO: Prefix by hostname and locale.
                }

                await Promise.all(results);

                const sitemapXml = sitemapBuilder.buildSitemap();
                const contentBytes = Utils.stringToUnit8Array(sitemapXml);

                await this.outputBlobStorage.uploadBlob("sitemap.xml", contentBytes, "text/xml");
            }
            catch (error) {
                this.logger.traceError(error, "Page publisher");
            }
        }
    }
}