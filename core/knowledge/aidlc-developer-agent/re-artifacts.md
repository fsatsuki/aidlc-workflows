# Reverse Engineering Artifact Templates

## Output Structure

All RE artifacts are created under `aidlc/spaces/<active-space>/codekb/<repo>/` — the durable per-repo code knowledge base shared across intents (the space-level directory the `codekb-path --repo <repo>` tool resolves).

## Quantitative Evidence Discipline (model- and OS-independent)

A **numeric claim** written into a CodeKB artifact MUST equal the **output of a counting operation you actually ran over the whole scope you are reporting on**. A number you did not obtain from an executed count is forbidden. **This is an execution requirement, not a labelling requirement** — writing "whole-tree count" next to an estimate is a violation.

### Count only what matters (keep it fast)

Do NOT exhaustively count every pattern in the repo. Count only the **few load-bearing numbers a downstream stage actually needs** to understand the system, and reach them with the **fewest counts possible**:

- **Required counts** (always, because design/implementation stages rely on them): total source-file count; approximate total LOC; number of top-level components/packages; the size of the primary external interface surface (e.g. HTTP routes / API endpoints / registered tools — whichever the system exposes), as a single whole-scope total.
- **Optional counts** (only if the active intent makes them relevant): tech-debt tallies (lint suppressions, TODO/FIXME, type-ignore), per-subtree breakdowns, secondary interface surfaces. If an optional number is not needed, **omit it** rather than counting it — a smaller, correct artifact beats a larger one.
- **Aggregate, don't enumerate**: when several patterns belong to one quantity (e.g. all the verbs of one routing style), obtain the total in **one** aggregated count, not one count per pattern. Break a total into parts only when the intent needs the breakdown.

### How to count (you choose the means for the environment)

This rule names **no fixed command**, so it holds on any OS and harness. Pick whatever counts deterministically over the whole scope in the current environment — a POSIX shell search, a Windows PowerShell search, or a language-runtime / editor search API. The requirement is the *behavior* (an executed whole-scope count whose raw output becomes the number), never a particular tool.

### Record and self-check

1. **Record each executed count and its raw output** in the developer scan's `### Count Log` — one line per required number: `` <what was counted / command or operation> → <raw output> ``.
2. **Each artifact number MUST be a Count Log output**, verbatim (round only for display, marked "~"/"about"). If prose and the Count Log disagree, the Count Log wins.
3. **One cheap sanity check on the primary interface total**: if any single file's share already exceeds your whole-scope total, the scope was wrong — re-run before writing the number. (Prevents the real failure of reporting ~149 routes for a package whose largest file alone had 173.)
4. **If a count cannot be run here, leave the number blank with "not counted — <reason>"** — never estimate.

This is what lets a fast, structure-level (Minimal-depth) scan ALSO be accurate: a few cheap whole-scope counts give exact figures without reading every file body — and counting only the load-bearing numbers keeps the scan fast.

### Required Artifacts

1. **business-overview.md** — Business domain context, purpose, key functionality
2. **architecture.md** — System architecture, patterns, component relationships, Mermaid diagrams
3. **code-structure.md** — Package/module organization, file classification, code patterns
4. **api-documentation.md** — External and internal API surfaces, endpoints, contracts
5. **component-inventory.md** — Complete component list with responsibilities and dependencies
6. **technology-stack.md** — Languages, frameworks, libraries with versions
7. **dependencies.md** — External dependencies, internal cross-package dependencies
8. **code-quality-assessment.md** — Test coverage, linting, CI/CD, documentation quality, tech debt
9. **reverse-engineering-timestamp.md** - Records when reverse engineering was performed (date, commit hash if available) in a Run Record section, plus the structured Scope of Analysis block (templates below). The scope block is machine-read by `codekb-scope-diff` on the next rerun, so its accuracy decides whether a future intent can reuse the verified coverage or must merge/replace it.

### Developer Code Scan Template

```markdown
## Developer Code Scan Results

### Scan Coverage
- **Analyzed deeply**: [repo-relative dirs/files actually read and understood, one per line]
- **Skimmed only**: [areas noted at directory granularity without deep reading]

### Count Log (Quantitative Evidence Discipline — one line per REQUIRED numeric claim)
- <what was counted> → <raw output of the executed count>
- (count only the load-bearing numbers; aggregate related patterns into one count; every number in the artifacts must trace to a line here; a count that could not run → "not counted — <reason>")

### Packages Found
- [package name] — [type] — [language] — [purpose]

### Build System
- **Type**: [build system]
- **Config Files**: [list]
- **Build Dependencies**: [package → package relationships]

### APIs Discovered
- [API type] — [location] — [primary interface total — MUST equal a Count Log line; no estimate]

### Frameworks & Libraries
- [name] — [version] — [purpose]

### Test Coverage
- **Test Directories**: [list]
- **Test Frameworks**: [list]
- **Coverage Config**: [present/absent]

### Code Quality Indicators
- **Linting**: [tool and config location]
- **CI/CD**: [pipeline files found]
- **Documentation**: [README presence, doc comments quality]

### Technical Debt Signals
- [signal description and location — only count a tally here if the intent needs it; any number MUST equal a Count Log line]

## Handoff Summary
- **Intent-relevant finding**: [the finding most relevant to the active intent, with file/line evidence]
- **Risks / follow-up**: [facts the architect or next stage must preserve; "None" if absent]
```

### Architecture Synthesis Template

```markdown
## Architecture Analysis

### System Overview
[High-level description of the system]

### Architectural Style
[Monolithic / Microservices / Serverless / Hybrid — with evidence]

### Component Relationships
[Mermaid diagram showing component interactions]

### Data Flow
[How data moves through the system]

### Key Design Decisions
[Notable architectural choices and their implications]

### Improvement Opportunities
[Areas where the architecture could be strengthened]

## Interaction Diagrams
[Mermaid sequence or flow diagrams showing how key business transactions are implemented across components]
```

### Run Record (reverse-engineering-timestamp.md)

Start reverse-engineering-timestamp.md with this section, so a reader sees
when the scan ran and against which commit before the Scope of Analysis block
below:

```markdown
# Reverse Engineering Timestamp

## Run Record

- Date: [ISO-8601 date of this run]
- Commit: [HEAD commit hash, or "unknown" when not available]
```

### Scope of Analysis Block (reverse-engineering-timestamp.md)

End reverse-engineering-timestamp.md with exactly this fenced block, filled
honestly from the Scan Coverage the developer reported - record what the run
ACTUALLY covered deeply, not what the stage aspired to cover:

````markdown
## Scope of Analysis

```yaml
scope_version: 1
kind: partial
intent: [active intent slug]
fingerprint: [output of the mint command in stage Step 3 - verbatim; it prints "unknown" when not computable]
analyzed:
  paths:
    - [repo-relative dir (trailing slash) or file analyzed deeply, one per line]
  components:
    - [component names exactly as they appear in component-inventory.md]
shallow:
  paths:
    - [areas only skimmed]
```
````

Rules:
- `kind: full` only when the scan genuinely covered the whole repo deeply; `analyzed.paths` MUST include the repo root (`./`). Anything less is `kind: partial`.
- `kind: partial` MUST NOT include `./` in `analyzed.paths`.
- `analyzed.paths` entries are repo-relative, directories end with `/`, no glob characters.
- Component names must match `component-inventory.md` headings verbatim - the rerun guard compares them literally.
- A full rescan wholesale replaces all 9 artifacts and builds this block only from the new run.
- For a focused scan of an existing store, read all 9 existing artifacts and the prior Scope of Analysis block first. Update or extend prose for the newly analyzed area and preserve prior prose outside it.
- With a CURRENT store, merge `analyzed.paths` and `analyzed.components` as the union of the store and this run. A CURRENT `kind: full` store remains full and retains `./`; otherwise the merged block is partial and cannot claim `./`.
- With a STALE or UNVERIFIED store, record only this run in `analyzed.paths` and `analyzed.components`, preserve the prior prose, and demote the store's prior analyzed paths into `shallow.paths`.
- With an UNKNOWN_SCOPE legacy store, merge the prior prose best-effort but record only this run in the new scope block.
- Mint `fingerprint` over the final `analyzed.paths` in the merged or replaced block.
- Build all 9 candidate artifacts under the temporary `<record>/.aidlc-engine/codekb-stage-<repo>/` directory. Never write a cumulative merge directly into the shared CodeKB.
- The pre-scan `codekb-snapshot` paths bound verified coverage. If the scan discovers a deep path outside that set, take a new snapshot and repeat the scan over the expanded set.
- Publish only through `codekb-publish` with the snapshot's store generation and source fingerprint. A store-generation conflict requires re-reading and re-merging the winner's store; a source conflict requires a fresh scan.
