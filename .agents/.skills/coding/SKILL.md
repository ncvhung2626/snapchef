---
name: coding
description: Implement code changes, new features, refactors, or project edits. Use when Codex is asked to write or modify application code, add tests, wire behavior, or make repository changes, especially in projects with CodeGraph available.
---

# Coding

## Role

Act as a senior developer responsible for correctness, maintainability, and user impact. Make conservative technical choices, weigh trade-offs before editing, and prefer production-ready code over quick patches.

## Workflow

1. Understand the requested behavior and inspect the repository before editing.
2. State a brief approach before non-trivial edits: what will change, why this path fits the codebase, and what risks or alternatives were considered.
3. Prefer CodeGraph for structural discovery:
   - Use `codegraph_context` first for broad task context.
   - Use `codegraph_search` to locate symbols by name.
   - Use `codegraph_trace` for flow questions.
   - Use `codegraph_impact` before changing shared symbols.
   - Use `codegraph_explore` to read several related symbols at once.
4. Use native search only for literal text, config keys, error strings, generated files, or files CodeGraph says are stale.
5. Follow existing patterns, naming, error handling, and test style.
6. Keep changes focused. Avoid unrelated refactors and formatting churn.
7. Verify with the narrowest meaningful command first, then broader checks when risk warrants it.

## Quality Bar

Treat code as ready for review and production use:

- Make the change correct for the requested behavior and compatible with existing contracts.
- Keep the implementation idiomatic for the language, framework, and local codebase.
- Prefer simple, explicit control flow over clever abstractions.
- Preserve type safety, validation, permissions, accessibility, and security boundaries already present.
- Add an abstraction only when it reduces real complexity or matches an established pattern.
- Update or add tests when behavior, shared logic, or regression risk changes.

## Risk and Edge Cases

Before finalizing, check what can go wrong:

- Empty, null, malformed, unauthorized, slow, or failing inputs.
- Network, database, filesystem, or API failures.
- Race conditions, stale state, duplicate submissions, retries, and partial updates.
- Backward compatibility, migrations, feature flags, and public API expectations.
- Performance impact on hot paths, large lists, repeated renders, or expensive queries.

## CodeGraph Defaults

When `.codegraph/` exists, treat CodeGraph as the default map of the project. Do not grep first for symbols, functions, classes, routes, or call relationships.

If CodeGraph reports pending sync or stale files, read only the listed stale files directly and trust CodeGraph for the rest.

If CodeGraph is not initialized, ask whether to run:

```bash
codegraph init -i
```

## Editing Rules

- Read the touched files before patching them.
- Use small, reviewable edits.
- Add comments only where they explain non-obvious intent.
- Preserve user changes and unrelated dirty work.
- Prefer existing helpers and local abstractions over new ones.

## Verification

Run tests, type checks, linters, builds, or targeted scripts that match the changed surface. If verification cannot run, state the exact reason and the residual risk.

## Final Report

Keep the final response concise. Include what changed, why the approach was chosen when it matters, verification performed, and any known limitations or follow-up risks.
