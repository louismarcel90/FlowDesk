import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import { DecisionApprovedTemplateV1 } from './email/decision-approved/v1/schema';

export type TemplateRef = { templateId: string; version: number };

export function renderEmail(template: TemplateRef, input: unknown) {
  if (template.templateId === 'email/decision-approved' && template.version === 1) {
    const parsed = DecisionApprovedTemplateV1.parse(input);

    const p = join(process.cwd(), 'src', 'templates', 'email', 'decision-approved', 'v1', 'template.hbs');
    const hbs = readFileSync(p, 'utf8');
    const compiled = Handlebars.compile(hbs);

    return {
      subject: `Decision approved: ${parsed.decisionTitle}`,
      html: compiled(parsed)
    };
  }

  throw new Error(`Unknown template ${template.templateId}@${template.version}`);
}
