# Definition of Ready (DoR) & Definition of Done (DoD)

## Definition of Ready
A story is Ready when:
- problem statement is clear
- acceptance criteria are defined
- dependencies are identified
- scope is small enough to finish within a sprint
- security/compliance impact is noted (if any)

## Definition of Done
A story is Done when:
- code is merged to `main` via PR
- required checks pass (`verify`)
- tests added/updated or explicitly not applicable
- documentation updated if behavior/contracts changed
- no secrets committed; logs do not include PII
- deployment impact is understood (even if not deployed yet)