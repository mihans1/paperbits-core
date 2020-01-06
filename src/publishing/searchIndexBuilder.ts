import * as lunr from "lunr";

interface SearchableDocument {
    permalink: string;
    title: string;
    description: string;
    body: string;
}

const indexerConfig = function (documents: SearchableDocument[]): lunr.ConfigFunction {
    return function (): void {
        this.ref("permalink");
        this.field("title");
        this.field("description");
        this.field("body");

        documents.forEach(document => this.add(document), this);
    };
};

export class SearchIndexBuilder {
    private documents: any[];

    constructor() {
        this.documents = [];
    }

    public appendPage(permalink: string, title: string, description: string, body: string): void {
        this.documents.push({
            permalink: permalink,
            title: title,
            description: description,
            body: body
        });
    }

    public buildIndex(): string {
        const index = lunr(indexerConfig(this.documents));
        return JSON.stringify(index);
    }
}