# Rippling OS Product Spec

Created by: Will
Last edited by: Will
Last updated time: January 28, 2026 3:59 PM
Editors: Will

# Rippling OS — Internal Product Spec

---

## 1. Problems That Exist

Today, teams at Rippling—especially Growth—lack an effective, shareable way to explore Snowflake data with AI assistance.

Key problems:

- Snowflake’s native UI lacks strong AI-driven exploration and explanation tools.
- Cursor has proven extremely effective at querying Snowflake and generating insights using the `rippling-os` repo.
- The existing `rippling-os` repo is messy, tightly coupled, and unsafe to broadly share.
- It does not support modern agent patterns (skills, subagents, hooks).
- Target users are semi-technical and uncomfortable working directly in an IDE or with Git.
- Current outputs (markdown files) are suboptimal; users want interactive dashboards and visual reports comparable to Snowflake dashboards.

Without addressing these issues, insights remain siloed, workflows are slow, and learnings are hard to share or compound across the team.

---

## 2. Users & Use Cases

### Primary Users

- **Growth Managers at Rippling**
    - Semi-technical
    - Comfortable writing SQL
    - Not comfortable with Git or IDE workflows

### Core Use Cases

- Ask plain-English business questions and get:
    - Executed Snowflake queries
    - Clear explanations of logic
    - Visual, interactive outputs
- Create analyses and reports that can be:
    - Saved
    - Iterated on
    - Shared with others
- Learn from others’ approved queries, dashboards, and patterns.

The overarching intent is to **increase individual effectiveness while creating shared institutional knowledge**.

---

## 3. Goals and Non-Goals

### Goals

- Enable users to query Snowflake, understand the underlying logic, and answer business questions using plain text.
- Provide a safe, structured version-control process for sharing approved queries, skills, and context.
- Leverage Cursor’s agent and skill system effectively and intentionally.
- Allow users to work without needing to understand Git or IDE mechanics.

### Non-Goals

- Building an over-engineered or overly abstract system.
- Replacing or avoiding existing systems like GitHub.
- Spending more time maintaining the system than generating business impact.

---

## 4. Proposed Solution

A **hybrid Cursor + web application system** built on top of a structured Git repository.

### High-Level Architecture

- Each user works on **their own branch**, abstracted away behind simple commands.
- A Cursor agent:
    - Answers questions
    - Runs Snowflake queries
    - Generates dashboards and reports
- Agent outputs are rendered as **web pages** tied to the user’s branch.

### Repository Structure

- **Main branch**
    - Global context
    - Global skills
    - Shared tools
    - Approved dashboards and reports
- **User branches**
    - Personal projects
    - Exploratory analyses
    - Draft dashboards
    - Personal context

Personal work is never automatically merged into `main`.

### Safety & Guardrails

- Skills, rules, and hooks prevent users or agents from:
    - Breaking shared state
    - Polluting global context
- All Git complexity is hidden behind commands.

---

## 5. Core Features

### Project Scoping

- Distinction between:
    - **Global projects** (shared, approved)
    - **Local projects** (personal, experimental)

---

### Input & Output Model

- **Input:** Natural language + SQL prompts inside Cursor
- **Output:** Interactive web dashboards and reports
- Outputs are rendered and hosted per user branch

---

### Web UI

- View personal dashboards and reports
- Access public / shareable URLs
- Browse pre-built global reports

---

### Skills System

### Core → User Skills

- `/setup`
    - Creates a new branch
    - Publishes initial site
- `/save`
    - Pushes changes to user branch
- `/update-os`
    - Rebases user branch against `main`
- `/create-project`
    - Creates a new project subfolder
    - Automatically appears in UI
- `/ingest-context`
    - Ingests local files or folders into project context

---

### Core → Global Skills

- Intake new “tribal knowledge”
    - Decide whether it becomes:
        - A personal rule / skill
        - A global contribution via PR
- Snowflake schema updates
    - Typically global
    - Kept authoritative and shared

---

### Project-Level Agent Capabilities

- Run Snowflake queries
- Update schema context
    - Including enums and possible values
    - Changes propagate globally when approved
- Build dashboards
- Generate reports

---

### Communication Model

- All interaction happens through **Cursor**
- No separate chat UI required

---

### Context Management

### Project Context

- Example queries
- Relevant SQL tables
- SQL functions
    - Agent should preferentially reuse these
- Snowflake schemas

### Personal Context Folder

- Never merged into `main`
- Used for sensitive or exploratory work
- Example:
    - Suppression logic
    - Experimental analyses