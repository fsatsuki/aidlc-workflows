# Reverse Engineering Artifact Templates

## Output Structure

All RE artifacts are created under `aidlc/spaces/<active-space>/codekb/<repo>/` — the durable per-repo code knowledge base shared across intents (the space-level directory the `codekb-path --repo <repo>` tool resolves).

## Quantitative Evidence Discipline (model- and OS-independent)

Every **numeric claim** written into any CodeKB artifact — API endpoint / route-registration counts, file counts, lines of code, type-ignore / lint-suppression counts, TODO/FIXME counts, component counts, dependency counts — MUST equal the **output of a counting command you actually ran over the whole target tree**. A number you did not obtain from a command's output is forbidden.

**This is an execution requirement, not a labelling requirement.** Writing "by whole-tree count" next to a number you estimated is a violation. The number must come FROM the command.

Mandatory procedure for every count:

1. **Run a counting command over the whole scope** you are reporting on — never one file, never a sample. The means is yours to choose for the environment (this rule names no fixed command, so it holds on any OS):
   - POSIX: `grep -rhoE '<pattern>' <root> | wc -l`, `grep -rc`, `find <root> -name '*.py' | wc -l`.
   - Windows PowerShell: `(Get-ChildItem -Recurse -Filter *.py | Measure-Object).Count`, `(Select-String -Path (Get-ChildItem -Recurse) -Pattern '<p>').Count`.
   - Or a language runtime / editor search API that returns a total over the whole tree.
2. **Record the exact command and its raw numeric output** in the developer scan's `### Count Log` (template below) — one line per count: `` `<command>` → <number> ``.
3. **The artifact number MUST be that recorded output**, verbatim (round only for display and mark with "~"/"about"). If a prose number and the Count Log disagree, the Count Log wins and the prose is wrong.
4. **Sanity check against a sub-part**: if any single file's count exceeds your whole-tree total, your command scope was wrong — re-run over the correct root before writing the number. (A real example of the failure this prevents: reporting ~149 route registrations for a package whose single largest file already has 173.)
5. **If no counting means is available in this environment, leave the number blank and write "not counted — <reason>"** — never estimate. A blank beats a wrong number.

This discipline is what lets a fast, structure-level (Minimal-depth) scan ALSO be accurate: a cheap whole-tree count gives the exact figure without reading every file body — but only if the number is the command's output, not the model's guess.

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

### Count Log (Quantitative Evidence Discipline — one line per numeric claim)
- `<exact command you ran>` → <raw numeric output>
- (every number in every artifact below must trace to a line here; if a count could not be run, write "not counted — <reason>")

### Packages Found
- [package name] — [type] — [language] — [purpose]

### Build System
- **Type**: [build system]
- **Config Files**: [list]
- **Build Dependencies**: [package → package relationships]

### APIs Discovered
- [API type] — [location] — [endpoints/methods count — MUST equal a Count Log line; no estimate]

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
- [signal description and location — any count MUST equal a Count Log line]

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
