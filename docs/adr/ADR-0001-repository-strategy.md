# ADR-0001: Repository Strategy (Monorepo for Microservices)

## Status
Accepted — 2026-01-07

## Context
Qarevo Health is being built as a modular platform using a microservice architecture
(API-first, event-driven, containerized). The team starts small (initially 1 developer,
scaling to ~5). We need:
- fast delivery without repository overhead
- enforceable engineering standards (CI gates, security baselines, documentation)
- clean evolution of API contracts and event schemas across service boundaries
- infrastructure-as-code kept versioned and reviewable alongside application code

## Decision
We will start with a **monorepo** as the primary repository model.

Microservices remain logically and operationally independent:
- each service has its own Dockerfile, configuration, tests, and deployment unit
- shared code is strictly limited (contracts/types/utilities only; no domain business logic)
- infra-as-code (Terraform/CDK), Helm charts, and ADRs live in the same repo

## Consequences
### Benefits
- single onboarding path: clone → bootstrap → run
- consistent quality and security enforcement via PR checks
- easier cross-service changes (contracts, auth middleware, observability)

### Risks
- CI/build times may grow
- coupling risk (“distributed monolith”) if shared code expands

## Non-negotiable Guardrails
1) Shared packages contain **no business logic** (contracts/types/utilities only).
2) No cross-service imports. Service communication happens via:
   - HTTP/REST + OpenAPI, and/or
   - gRPC, and/or
   - events (Kafka/MSK)
3) Every service must own:
   - Dockerfile
   - README (local run instructions)
   - config schema (env vars, validation)
   - test suite
4) CODEOWNERS is required per service folder.
5) CI is path-aware (build/test only impacted services).

## Revisit Criteria (When to split into multi-repo)
We will consider splitting when at least two are true:
- 2+ teams exist with strong service ownership and independent roadmaps
- different compliance/security boundaries require strict access separation
- release cycles diverge significantly
- build/CI becomes too slow even after caching and path-based jobs

## Alternatives Considered
- Multi-repo from day one: higher overhead, slower standardization, harder onboarding
- Hybrid: possible later (e.g., isolating AI/compliance-heavy components), not needed initially
