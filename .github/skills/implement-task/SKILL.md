---
name: implement-task
description: "Implement tasks from docs/tasks/ in the Cukkr monorepo. Use when: starting work on a backlog task, implementing a feature spec, fixing a bug from task docs, or marking task steps as done. Lists all pending tasks from docs/tasks/**/*.md and lets user pick one to implement, then checks off completed steps."
argument-hint: "Task ID or title to implement (e.g. TASK-003), or leave blank to see all pending tasks"
---

# Implement Task

## Purpose

This skill scans all task markdown files under `docs/tasks/`, presents the user with pending (not fully completed) tasks, implements the chosen task step-by-step, and updates the markdown file to check off each completed step.

See [TASKS-EXAMPLE.md](../create-task/TASKS-EXAMPLE.md) for the expected file format.

---

## Step 1 — Discover Pending Tasks

Use `file_search` to find all `.md` files under `docs/tasks/` recursively. For each file found, read its contents and collect:

- **Task ID** — the `TASK-XXX` heading identifier
- **Task title** — the text after `·` in the heading
- **Tags** — the sub-projects listed under `**Tags:**`
- **Progress** — count of `- [ ]` (pending) vs `- [x]` (done) steps **only inside the `Implementation Plan` section**. Ignore checkboxes under `Manual Verification (Human Checklist)` — those are for humans, not the agent.
- **Status** — `DONE` if zero `- [ ]` items remain in the `Implementation Plan`, otherwise `PENDING`

List only tasks with `Status = PENDING`.

---

## Step 2 — Ask the User Which Task to Implement

Present the pending tasks as selectable options and ask the user which one to work on. Use the `vscode_askQuestions` tool with:

- Options listing each pending task as `TASK-XXX · <title> [n remaining steps]`
- Allow freeform input so the user can type a task ID, a title keyword, or describe something not in the list

If the user provided a task ID or title as an argument when invoking the skill, skip this step and proceed directly.

**Open clarification questions to ask alongside task selection (when relevant):**

- Should all remaining `- [ ]` steps be implemented in this session, or only specific ones?
- Are there any steps to **skip** or deprioritize?
- Is there additional context or a constraint not captured in the task description (e.g., API already changed, new design decision)?
- Should the implementation follow any specific approach not mentioned in the task?

---

## Step 3 — Read AGENTS.md for Affected Projects

Read the `AGENTS.md` file for each sub-project tagged in the selected task before writing any code.

| Tag | AGENTS.md to read |
|---|---|
| `cukkr-backend` | `cukkr-backend/AGENTS.md` |
| `cukkr-frontend` | `cukkr-frontend/AGENTS.md` |

Also read the root `AGENTS.md`. This establishes the coding conventions, tech stack, file structure, and patterns expected for each project. Pay special attention to the **Sync Types Frontend** section in the root `AGENTS.md` if the task modifies backend endpoints.

---

## Step 4 — Explore the Codebase

Before making any changes, explore the files mentioned in the task's **Implementation Plan**. Use `read_file`, `grep_search`, or `semantic_search` to:

- Read each file referenced in the implementation plan checklist
- Understand the existing code structure, types, and patterns
- Identify any dependencies or side effects not captured in the task

Do not start implementing until you have read all relevant files.

---

## Step 5 — Implement Each Step

Work through the unchecked `- [ ]` items in the **Implementation Plan** sequentially. **Do not execute, check off, or attempt to perform any item under `Manual Verification (Human Checklist)`** — those steps require a human and must be left untouched.

For each `Implementation Plan` step:

1. Identify the exact file(s) and function(s) to change.
2. Read the relevant section of the file before editing.
3. Make the change using `replace_string_in_file` or `multi_replace_string_in_file`.
4. Verify the change with `get_errors` if the file is TypeScript or has a language server.
5. Confirm the step is complete before moving to the next.

**Backend-specific rules (from `cukkr-backend/AGENTS.md`):**
- Always throw `AppError` from `src/core/error.ts` — never `new Error(...)`.
- Run `bun run lint:fix` and `bun run format` after changes.
- Write or update tests in `tests/modules/<module-name>.test.ts` for any new or changed behavior.
- Use `bunx drizzle-kit generate --name <name>` for schema changes — never `push` or `drop`.

**Frontend-specific rules (from `cukkr-frontend/AGENTS.md`):**
- Never hardcode hex values — always use tokens from `src/theme/colors.ts`.
- Screens call services/hooks; never fetch directly in a screen.
- After backend endpoint changes, sync types: `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts` (run from `cukkr-frontend/`).
- Use `useToast()` for user feedback — never `Alert`.

**After all steps, run the build for each affected project** and fix any errors before marking complete. Refer to `AGENTS.md` for the exact build command.

---

## Step 6 — Update the Task File

After each step is implemented and verified, update the corresponding task markdown file by replacing `- [ ]` with `- [x]` for the completed step.

**Rules for updating:**
- Check off only steps that are fully implemented and verified.
- Only update checkboxes inside the `Implementation Plan` section. **Never** modify checkboxes inside the `Manual Verification (Human Checklist)` section.
- Do not check off optional steps (`Optionally...`) unless they were actually done.
- Do not modify the **Description**, **Tags**, **Manual Verification (Human Checklist)**, or any other section.
- If a step was skipped by user request, leave it as `- [ ]` and add a brief inline note: `- [ ] <original text> *(skipped: <reason>)*`.

**Example transformation:**
```markdown
<!-- Before -->
- [ ] In `cukkr-backend/src/modules/bookings/service.ts`, add status transition guard for `accept`.

<!-- After -->
- [x] In `cukkr-backend/src/modules/bookings/service.ts`, add status transition guard for `accept`.
```

---

## Step 7 — Completion Summary

After all steps are done (or the session is complete), report:

- Which `Implementation Plan` steps were implemented (`- [x]`)
- Which `Implementation Plan` steps remain (`- [ ]`), with a brief reason if skipped
- Any files modified (link to them)
- The full **Manual Verification (Human Checklist)** copied verbatim, presented as the actions the user must now perform to verify the work
- Any follow-up actions needed (e.g., run migration, restart dev server, sync frontend types)

---

## Completion Criteria

A task is **fully complete** when all `- [ ]` items in its `Implementation Plan` have been converted to `- [x]`. The `Manual Verification (Human Checklist)` section is **not** part of the agent's completion criteria — it remains untouched for the human to tick off after manual testing.

---

## Important Rules

- Always read the relevant `AGENTS.md` files before writing code (Step 3).
- Always read the target files before editing them (Step 4).
- Never check off a step that has not been implemented.
- Never implement, execute, or check off any item under `Manual Verification (Human Checklist)`.
- Never implement steps not listed in the task's Implementation Plan unless the user explicitly requests it.
- Use `get_errors` after TypeScript edits to catch type errors before moving on.
- If a step is ambiguous, ask the user before implementing — do not guess.
- If a backend endpoint changes, always include a type sync step for the frontend.
