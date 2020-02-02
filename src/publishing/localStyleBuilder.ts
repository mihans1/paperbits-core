import { StyleSheet } from "@paperbits/common/styles";
import { JssCompiler } from "@paperbits/styles/jssCompiler";
import * as Utils from "@paperbits/common/utils";
import { IBlobStorage } from "@paperbits/common/persistence";

export class LocalStyleBuilder {
    constructor(private readonly outputBlobStorage: IBlobStorage) { }

    public async buildLocalStyle(permalink: string, styleSheets: StyleSheet[]): Promise<void> {
        const compiler = new JssCompiler();
        let css = "";
        let uploadUrl;

        if (permalink === "/") {
            uploadUrl = `/styles/styles.css`;
            styleSheets = styleSheets.slice(0, 1);
        }
        else {
            uploadUrl = `${permalink}/${permalink}.css`;
            styleSheets = styleSheets.slice(1);
        }

        styleSheets.forEach(styleSheet => {
            css += " " + compiler.styleSheetToCss(styleSheet);
        });

        const contentBytes = Utils.stringToUnit8Array(css);

        await this.outputBlobStorage.uploadBlob(uploadUrl, contentBytes, "text/css");
    }
}