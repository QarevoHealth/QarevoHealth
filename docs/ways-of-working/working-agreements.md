# Working Agreements (Qarevo Health)

## Principles
- We optimize for **patient safety**, **security**, and **reliability**.
- We default to **small, reviewable changes**.
- We document decisions that affect architecture, security, or compliance (ADRs).

## Communication
- Daily async update (3 bullets): **yesterday / today / blockers**
- Blocking issues are raised immediately (no waiting for meetings).

## Pull Requests
- All changes go through a PR (no direct pushes to `main`).
- PRs should be small: ideally < 300 lines changed.
- Every PR must:
  - pass required checks (`verify`)
  - include test notes (or “not applicable”)
  - avoid secrets and PII in logs

## Ownership
- CODEOWNERS define review ownership.
- The owning reviewer is responsible for correctness and risk assessment.

## Decision making
- Significant decisions require an ADR:
  - service boundaries, data ownership, auth, infra approach, compliance constraints