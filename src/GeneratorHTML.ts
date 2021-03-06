import {GeneratorBase} from "./GeneratorBase";
import {MDUtils} from "./MDUtils";
import {FileUtils} from "./FileUtils";
import {IFileContent} from "./interfaces/interfaces";
import {$log} from "ts-log-debug";
import * as Path from "path";

export class GeneratorHTML extends GeneratorBase {

    /**
     *
     * @param filesContents
     */
    generate(filesContents: IFileContent[]): Promise<any> {

        $log.debug("Task generate HTML");

        let promises = filesContents
            .map((fileContent: IFileContent) => {

                const file = fileContent.path.replace(".md", ".html");

                const content = this.replace(
                    MDUtils.markdownToHTML(fileContent.content),
                    filesContents
                );

                return this
                    .render("page", {
                        body: content,
                        menu: this.getMenu(filesContents, "uri")
                    })
                    .then(content => FileUtils.write(Path.join(this.task.path, file), content));

            });

        promises = promises.concat(this.copyAssets());

        return Promise.all(promises);
    }

    /**
     *
     * @param content
     * @param filesContents
     * @param cb
     * @returns {string}
     */
    private replace(content: string, filesContents: IFileContent[], cb: Function = c => c): string {
        const { root, repository, branch} = this.settings;

        const project = repository + Path.join("blob", branch);

        let rules = this.createRules();

        rules = rules.concat(
            this.settings.concat.files.map(file => ({
                from: file.path,
                to: file.path.replace(".md", ".html")
            }))
        );

        rules = rules.concat(
            filesContents
                .map(fileContent => ({
                    from: Path.join(project, fileContent.path.replace(root + "/", "")),
                    to: fileContent.path
                        .replace(".md", ".html")
                        .replace("readme", "index")
                }))
        );

        if (this.task.resources) {
            rules = rules.concat(this.getRulesResourcesTags(this.getResourcesRelativePath()));
        }

        rules.push({
            from: project,
            to: ""
        });

        return this.replacer(content, rules);
    }
}