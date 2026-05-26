---
name: create-task
description: "Create structured task documentation in docs/tasks/<date>/<task-slug>.md for the Cukkr monorepo. Use when: writing a new feature task, breaking down a backlog item, documenting a bug fix spec, or planning implementation steps across cukkr-backend and cukkr-frontend."
argument-hint: "Describe the feature or bug to document as a task"
---

# Create Task Documentation

## Purpose

This skill produces a well-structured task markdown file under `docs/tasks/YYYY-MM-DD/<task-slug>.md`, following the exact format used in [TASKS-EXAMPLE.md](./TASKS-EXAMPLE.md). Each task includes a clear description of the problem or feature, a concrete implementation plan with file-level checkboxes, and relevant project tags.

---

## Output Location

```
docs/tasks/<YYYY-MM-DD>/<task-slug>.md
```

- `YYYY-MM-DD` — today's date
- `task-slug` — kebab-case short identifier derived from the task title (e.g., `booking-status-sync`)

---

## Step-by-Step Procedure

### Step 1 — Read AGENTS.md for Affected Projects

Before writing the task, read the `AGENTS.md` file for each sub-project involved in this task.

| Project | File |
|---|---|
| Monorepo root | `AGENTS.md` |
| Backend | `cukkr-backend/AGENTS.md` |
| Frontend | `cukkr-frontend/AGENTS.md` |

Read only the files relevant to the task's scope. This provides the context needed to write accurate file paths, function names, and implementation steps.

---

### Step 2 — Clarify the Task with the User

Ask the user open questions whenever the task description is ambiguous or incomplete. Do not assume answers to the following:

**Clarification questions to ask when not already answered:**

- Which sub-projects are involved? (`cukkr-backend`, `cukkr-frontend`, or both)
- Is this a **bug fix**, **new feature**, or **improvement/refactor**?
- Are there **schema or data model changes** required? (Drizzle migration needed?)
- Are there **existing components, hooks, or services** that should be reused or extended?
- What should happen in **edge cases**? (e.g., null data, failed async operations, offline state)
- Should **backward compatibility** be preserved?
- Is there a **related task** that must be completed first or in parallel?
- Are there **UI/UX requirements** for frontend changes? (e.g., specific design patterns, form behavior)
- If the backend adds/changes endpoints: does the frontend need a **type sync** (`bunx type-share-eden-elysia sync`)?

Ask only the questions that are genuinely unclear. If the user's input already covers a point, skip that question.

---

### Step 3 — Determine the Task ID

Check existing task files in `docs/tasks/` to determine the next available `TASK-XXX` number. Use the next sequential integer (e.g., if the highest existing ID is `TASK-005`, use `TASK-006`). If no tasks exist yet, start at `TASK-001`.

---

### Step 4 — Write the Task File

Create the file at `docs/tasks/YYYY-MM-DD/<task-slug>.md` using the format below.

---

## Task File Format

Every task file follows this exact structure:

```markdown
# Cukkr Backlog Tasks

> Last updated: YYYY-MM-DD

---

## TASK-XXX · <Task Title>

**Description:**
<A detailed paragraph explaining the current state, the root cause or motivation for the change, and the expected behavior after the task is complete. Reference specific files, components, fields, or API endpoints where relevant. Do not use bullet points here — write in flowing prose.>

**Implementation Plan:**
- [ ] <Concrete action. Reference the exact file path and function/component name.>
- [ ] <Next step. Include specific field names, endpoint paths, or enum values.>
- [ ] <Continue until all steps are covered. Each item is one focused action.>
- [ ] Files to modify: `path/to/file.ts`, `another/file.tsx`.

**Manual Verification (Human Checklist):**
- [ ] <Manual step a human must perform to verify the task — e.g., open a specific screen, create test data, tap a button, observe a result.>
- [ ] <Next manual step. Be explicit about the route/screen, the data to seed, the action to take, and the expected outcome.>
- [ ] <Continue until all human-only verification steps are covered.>

**Tags:** `cukkr-backend`, `cukkr-frontend`
```

---

## Format Rules

- **Description** is a prose paragraph, not a list. It covers: current behavior → root cause or motivation → expected behavior after completion.
- **Implementation Plan** uses `- [ ]` checkboxes. Each item is one concrete action referencing exact file paths, function names, field names, or API endpoint paths.
- **Manual Verification (Human Checklist)** uses `- [ ]` checkboxes for steps that cannot be automated and require a human — opening a specific screen, seeding or creating data through the UI, tapping a button, inspecting a UI state, verifying a notification. Each item must state **where** (screen/route), **what** (action or data), and **expected result**. Do not include steps that the implementation plan already automates.
- **Tags** include only the sub-projects actually touched by this task. Options: `cukkr-backend`, `cukkr-frontend`.
- Use backtick code spans `` `like this` `` for: file paths, function names, variable names, field names, API routes, enum values, and component names.
- Do not add sections beyond `Description`, `Implementation Plan`, `Manual Verification (Human Checklist)`, and `Tags` unless the user explicitly requests additional structure.
- Keep language factual and precise. Avoid vague phrases like "handle appropriately" or "update as needed" — every step must be actionable.
- If the task involves backend endpoint changes, include a step to sync frontend types: `bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts` (run from `cukkr-frontend/`).

---

## Example Output

See [TASKS-EXAMPLE.md](./TASKS-EXAMPLE.md) for full real-world examples of correctly formatted tasks.

---

## When to Ask More Questions

After drafting the task, identify the most ambiguous implementation decisions and present them to the user before finalizing. Examples:

- "Should the booking cancellation also trigger a push notification, or only an in-app notification?"
- "Should the new field be nullable (optional) or required with a migration default?"
- "Is there an existing modal component to reuse, or should a new one be created?"

Iterate on the draft until the user confirms it is complete and accurate.
