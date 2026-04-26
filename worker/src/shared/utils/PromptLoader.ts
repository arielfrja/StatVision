import * as fs from 'fs';
import * as path from 'path';

export class PromptLoader {
    private static promptDir = path.join(__dirname, '../../../worker/prompts');

    public static loadPrompt(fileName: string, variables: Record<string, string> = {}): string {
        const filePath = path.join(this.promptDir, `${fileName}.md`);
        let content = fs.readFileSync(filePath, 'utf8');

        for (const [key, value] of Object.entries(variables)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(placeholder, value);
        }

        return content;
    }

    /**
     * Extracts a specific section from a ruleset markdown file based on tags.
     * e.g., <FULL_COURT>...</FULL_COURT>
     */
    public static getRulesetInstruction(tag: string): string {
        const filePath = path.join(this.promptDir, `rulesets.md`);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const regex = new RegExp(`<${tag}>([\s\S]*?)<\/${tag}>`, 'i');
        const match = content.match(regex);
        
        return match ? match[1].trim() : '';
    }
}
