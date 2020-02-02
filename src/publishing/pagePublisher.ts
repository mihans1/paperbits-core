import * as Utils from "@paperbits/common/utils";
import { IPublisher, HtmlPage, HtmlPagePublisher } from "@paperbits/common/publishing";
import { IBlobStorage } from "@paperbits/common/persistence";
import { IPageService, PageContract } from "@paperbits/common/pages";
import { ISiteService } from "@paperbits/common/sites";
import { Logger } from "@paperbits/common/logging";
import { IMediaService } from "@paperbits/common/media";
import { SitemapBuilder } from "./sitemapBuilder";
import { SearchIndexBuilder } from "./searchIndexBuilder";
import { StyleManager } from "@paperbits/styles";
import { LocalStyleBuilder } from "./localStyleBuilder";
import { StyleCompiler } from "@paperbits/common/styles";


export class PagePublisher implements IPublisher {
    private localStyleBuilder: LocalStyleBuilder;

    constructor(
        private readonly pageService: IPageService,
        private readonly siteService: ISiteService,
        private readonly mediaService: IMediaService,
        private readonly outputBlobStorage: IBlobStorage,
        private readonly htmlPagePublisher: HtmlPagePublisher,
        private readonly styleCompiler: StyleCompiler,
        private readonly logger: Logger
    ) {
        this.localStyleBuilder = new LocalStyleBuilder(this.outputBlobStorage);
    }

    public async renderPage(page: HtmlPage): Promise<string> {
        this.logger.traceEvent(`Publishing page ${page.title}...`);

        const htmlContent = await this.htmlPagePublisher.renderHtml(page);
        return htmlContent;
    }

    private async renderAndUpload(settings: any, page: PageContract, indexer: SearchIndexBuilder): Promise<void> {
        const pageContent = await this.pageService.getPageContent(page.key);

        const htmlPage: HtmlPage = {
            title: [page.title, settings.site.title].join(" - "),
            description: page.description || settings.site.description,
            keywords: page.keywords || settings.site.keywords,
            permalink: page.permalink,
            content: pageContent,
            styleReferences: [
                `/styles/styles.css`,
                page.permalink === "/"
                    ? "/styles.css"
                    : `${page.permalink}/styles.css`
            ],
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

        if (settings.site.faviconSourceKey) {
            try {
                const media = await this.mediaService.getMediaByKey(settings.site.faviconSourceKey);

                if (media) {
                    htmlPage.faviconPermalink = media.permalink;
                }
            }
            catch (error) {
                this.logger.traceError(error, "Could not retrieve favicon.");
            }
        }

        // Cleaning up styles before rendering the page
        // this.styleManager.removeAllStyleSheets(); 

        const htmlContent = await this.renderPage(htmlPage);

        // // Building local styles
        // const styleSheets = this.styleManager.getAllStyleSheets();
        // console.log(styleSheets);
        // this.localStyleBuilder.buildLocalStyle(page.permalink, styleSheets.slice(1));

        indexer.appendPage(htmlPage.permalink, htmlPage.title, htmlPage.description, htmlContent);

        let permalink = page.permalink;

        const regex = /\/[\w]+\.html$/gm;
        const isHtmlFile = regex.test(permalink);

        if (!isHtmlFile) {
            /* if filename has no *.html extension we publish it to a dedicated folder with index.html */

            if (!permalink.endsWith("/")) {
                permalink += "/";
            }

            permalink = `${permalink}index.html`;
        }

        const contentBytes = Utils.stringToUnit8Array(htmlContent);
        await this.outputBlobStorage.uploadBlob(permalink, contentBytes, "text/html");
    }

    public async publish(): Promise<void> {
        const styleSheet = await this.styleCompiler.getStyleSheet();
        // this.styleManager.setStyleSheet(styleSheet);

        // // Building global styles
        // const styleSheets = this.styleManager.getAllStyleSheets();
        // this.localStyleBuilder.buildLocalStyle("styles", styleSheets.slice(0, 1));

        try {
            const pages = await this.pageService.search("");
            const results = [];
            const settings = await this.siteService.getSiteSettings();
            const sitemapBuilder = new SitemapBuilder(settings.site.hostname);
            const searchIndexBuilder = new SearchIndexBuilder();

            for (const page of pages) {
                results.push(this.renderAndUpload(settings, page, searchIndexBuilder));
                sitemapBuilder.appendPermalink(page.permalink);
            }

            await Promise.all(results);

            const index = searchIndexBuilder.buildIndex();
            const indexBytes = Utils.stringToUnit8Array(index);
            await this.outputBlobStorage.uploadBlob("search-index.json", indexBytes, "application/json");

            const sitemap = sitemapBuilder.buildSitemap();
            const contentBytes = Utils.stringToUnit8Array(sitemap);
            await this.outputBlobStorage.uploadBlob("sitemap.xml", contentBytes, "text/xml");
        }
        catch (error) {
            this.logger.traceError(error, "Page publisher");
        }
    }
}