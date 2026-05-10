import * as fs from 'fs';
import * as path from 'path';

export class PromptLoader {
    // Path relative to the compiled JS file in build/infrastructure/
    private static promptDir = path.join(__dirname, 'prompts');

    public static loadPrompt(fileName: string, variables: Record<string, string> = {}): string {
        const filePath = path.join(this.promptDir, `${fileName}.md`);
        
        // Fallback for development (if run from src)
        let finalPath = filePath;
        if (!fs.existsSync(finalPath)) {
            finalPath = path.join(__dirname, '../../src/infrastructure/prompts', `${fileName}.md`);
        }

        let content = fs.readFileSync(finalPath, 'utf8');

        for (const [key, value] of Object.entries(variables)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(placeholder, value);
        }

        return content;
    }

    public static getRulesetInstruction(tag: string): string {
        const filePath = path.join(this.promptDir, `rulesets.md`);
        
        let finalPath = filePath;
        if (!fs.existsSync(finalPath)) {
            finalPath = path.join(__dirname, '../../src/infrastructure/prompts', `rulesets.md`);
        }

        const content = fs.readFileSync(finalPath, 'utf8');
        const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const match = content.match(regex);
        
        return match ? match[1].trim() : '';
    }
}
