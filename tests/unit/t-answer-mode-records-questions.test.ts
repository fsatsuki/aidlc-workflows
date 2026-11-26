// covers: file:core/aidlc-common/protocols/stage-protocol.md
//
// Every answer mode of the questions procedure (Step 3a Guide me, Step 3b I'll
// edit the file, Step 3c Chat) and the Answer analysis follow-up rule must tell
// the agent to record a non-gate question with `log decision` before it is asked
// and `log answer` after it is answered, matching the general rules.

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const protocol = readFileSync(
  join(import.meta.dir, "../../core/aidlc-common/protocols/stage-protocol.md"),
  "utf8",
);

function section(start: string, end: string): string {
  const from = protocol.indexOf(start);
  const to = protocol.indexOf(end, from + start.length);
  expect(from).toBeGreaterThan(-1);
  expect(to).toBeGreaterThan(from);
  return protocol.slice(from, to);
}

const modes: [string, string, string][] = [
  ["Step 3a", "**Step 3a:", "**Step 3b:"],
  ["Step 3b", "**Step 3b:", "**Step 3c:"],
  ["Step 3c", "**Step 3c:", "Users can switch modes"],
];

for (const [name, start, end] of modes) {
  test(`${name} records the question and the answer`, () => {
    const body = section(start, end);
    expect(body).toContain("{{INVOKE}} engine log decision --stage <slug>");
    expect(body).toContain("{{INVOKE}} engine log answer --stage <slug>");
  });
}

test("follow-up questions are recorded in every mode", () => {
  const body = section("### Answer analysis (MANDATORY)", "**Write every pending question");
  expect(body).toContain("log decision");
  expect(body).toContain("log answer");
});
