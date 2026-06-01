# Material Import Wizard — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development

**Goal:** Build a 3-step in-page wizard (Select → Edit → Assign) that imports pipeline materials into tutorials.

**Architecture:** Modal overlay with StepProgress bar, 3 sequential steps, state lifted to ImportWizard container.

**Tech Stack:** React 18, CSS var(--token), existing StepProgress component, pipelineApi service

---

## Files Changed
| File | Action |
|------|--------|
| `frontend/src/pages/Admin/ImportWizard.jsx` | Create — wizard container |
| `frontend/src/pages/Admin/ImportWizard.css` | Create — wizard styles |
| `frontend/src/pages/Admin/StepSelectMaterials.jsx` | Create — step 1 |
| `frontend/src/pages/Admin/StepEditMetadata.jsx` | Create — step 2 |
| `frontend/src/pages/Admin/StepAssignPublish.jsx` | Create — step 3 |
| `frontend/src/pages/Admin/TutorialManager.jsx` | Modify — wire button |

---

### Task 1: ImportWizard container with StepProgress

Create ImportWizard.jsx (container with currentStep state, StepProgress bar, step routing) + ImportWizard.css (modal overlay styles). Three placeholder step components exporting default.

### Task 2: Step 1 — Select Materials

Fetch from pipelineApi.fetchMaterials(), render checkbox list with search/filter, track selected Set, enable "下一步" button when selection > 0.

### Task 3: Step 2 — Edit Metadata

Collapsible cards per material, edit title/category/difficulty/tags/time, batch-set category/difficulty dropdowns.

### Task 4: Step 3 — Assign Pathways + Publish

Per-material pathway dropdown (from getAllPathways), publish toggle, "完成导入" submits all → calls pipelineApi.createMaterial() per item → success summary.

### Task 5: Wire TutorialManager → ImportWizard

Replace handleImport to set showImportWizard state. Add ImportWizard render with onComplete handler that calls createMaterial and reloads.

### Task 6: Integration test + Docker rebuild

Build, rebuild Docker, browser test, commit.
