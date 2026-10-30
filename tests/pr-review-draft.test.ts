import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The /pr-review skill drafts a PR body in the shape of .github/pull_request_template.md.
 * This fails if the draft's headings drift from the template. Like the other structural
 * tests, it reads files and never runs anything.
 */

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

function headings(markdown: string): string[] {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.trim());
}

/** The fenced markdown block under "Draft PR description" in the skill's report format. */
function draftBlock(reportFormat: string): string {
  const section = reportFormat.split("## Draft PR description")[1] ?? "";
  return section.match(/```markdown\n([\s\S]*?)\n```/)?.[1] ?? "";
}

describe("pr-review draft PR description", () => {
  const template = headings(read(".github/pull_request_template.md"));
  const draft = headings(draftBlock(read(".claude/skills/pr-review/report-format.md")));

  it("the template still has its six headings", () => {
    expect(template).toHaveLength(6);
  });

  it("the draft uses the template's headings, same text and order", () => {
    expect(
      draft,
      "The draft in .claude/skills/pr-review/report-format.md must match .github/pull_request_template.md exactly. " +
        "Edit the template's headings in both places together.",
    ).toEqual(template);
  });
});
