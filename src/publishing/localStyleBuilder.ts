import { StyleSheet } from "@paperbits/common/styles";
import { JssCompiler } from "@paperbits/styles/jssCompiler";
import * as Utils from "@paperbits/common/utils";
import { IBlobStorage } from "@paperbits/common/persistence";

export class LocalStyleBuilder {
    constructor(private readonly outputBlobStorage: IBlobStorage) { }

    public async buildLocalStyle(permalink: string, styleSheets: StyleSheet[]): Promise<void> {
        const compiler = new JssCompiler();
        let css = "";

        styleSheets.forEach(styleSheet => {
            css += " " + compiler.styleSheetToCss(styleSheet);
        });

        const contentBytes = Utils.stringToUnit8Array(css);

        await this.outputBlobStorage.uploadBlob(`${permalink}/${permalink}.css`, contentBytes, "text/css");
    }
}