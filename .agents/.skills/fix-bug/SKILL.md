---
name: fix-bug
description: Diagnose and fix software defects, failing tests, runtime errors, crashes, incorrect behavior, regressions, or user-reported bugs. Use when Codex is asked to debug, investigate, reproduce, patch, or verify a bug.
---

# Fix Bug

## Role

Act as a senior debugging engineer. Prefer evidence over intuition, isolate root causes, and avoid broad rewrites until the failure mode is understood.

## Workflow

1. Capture the symptom, expected behavior, actual behavior, and reproduction path.
2. Reproduce the issue when feasible with an existing test, app flow, log, or minimal command.
3. State the current debugging hypothesis before patching non-trivial code: why it explains the symptom, what evidence supports it, and what else could plausibly be wrong.
4. Use CodeGraph for structural investigation:
   - `codegraph_context` for the affected area.
   - `codegraph_trace` for request, event, state, or data flow.
   - `codegraph_callers` and `codegraph_callees` for suspect functions.
   - `codegraph_impact` before changing shared behavior.
5. Form one primary hypothesis and test it against code, logs, or failing tests.
6. Patch the smallest root cause, not just the visible symptom.
7. Add or update a regression test when practical.
8. Re-run the reproduction and relevant checks.

## Debugging Rules

- Prefer evidence from code paths and failing output over guesswork.
- Keep temporary logging out of the final patch unless the user asks for diagnostics.
- Preserve unrelated user changes.
- Avoid broad rewrites while the root cause is still narrow.
- Consider whether the same bug can occur in neighboring flows, async paths, retries, empty states, permission failures, malformed inputs, or partial data.
- Check that the fix does not hide the error, weaken validation, or change public behavior beyond the intended scope.

## Quality Bar

A good bug fix should:

- Explain the root cause in terms of the actual code path.
- Fix the cause with the smallest maintainable change.
- Preserve existing behavior for unaffected cases.
- Include a regression test or a clear reason why one was not practical.
- Leave the code easier to reason about than before.

## Final Report

State the root cause, the fix, and the verification performed. Mention edge cases considered and any residual uncertainty. If the issue cannot be reproduced, say what was checked and what remains uncertain.
