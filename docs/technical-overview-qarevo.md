# Qarevo — Technischer Überblick (für R&D / Antragstexte)

## 1) Kurzfassung
Qarevo ist eine modulare Plattform für digitale Versorgungsprozesse (Termine, Auth, Konsultation/Video, Benachrichtigungen) mit Cloud-Infrastruktur auf AWS. Ziel ist ein belastbares “Operating System” für skalierbare Entwicklung (Repo-Standards, CI, IaC, Staging-first).

## 2) Aktueller Implementierungsstand (Stand heute)
### Repository / Engineering
- Monorepo-Struktur etabliert:
  - `apps/web` (Web-Frontend)
  - `services/auth`, `services/appointments`, `services/consultation` (Backend-Services)
  - `packages/contracts`, `packages/shared` (Shared Types/DTOs, gemeinsame Libs)
  - `infra/terraform`, `infra/helm` (Infrastructure-as-Code + Kubernetes Deployment Skeleton)
  - `docs/` (ADRs, Ways-of-working, Architektur)
- GitHub-Prozess steht (Branches → PR → CI → Merge).
- CI/Workflows wurden bereits auf GitHub Actions ausgerichtet.

### AWS / Infrastruktur (IaC mit Terraform)
- Remote Terraform State (S3 + DynamoDB Lock) für Staging eingerichtet.
- Staging Networking ist provisioniert:
  - VPC + Public/Private Subnets über mehrere AZs
  - NAT Gateway, IGW, Route Tables
  - Output-IDs (VPC/Subnets) sind im Terraform State gespeichert

## 3) Zielarchitektur (High-Level)
### Komponenten
- Web Frontend (Next.js o. ä.) → spricht Backend über HTTPS APIs
- Backend Services (auth/appointments/consultation/notifications) → laufen containerisiert
- Datenhaltung (geplant): Managed PostgreSQL (RDS/Aurora) + Cache (Redis)
- Observability (geplant): zentralisiertes Logging + Metrics + Tracing

### AWS Zielbild (Staging zuerst)
- Networking: VPC, Public Subnets (Ingress/LB), Private Subnets (EKS Nodes/DB)
- Compute: EKS (Kubernetes) mit NodeGroups in Private Subnets
- Ingress: AWS Load Balancer Controller (ALB Ingress)
- Secrets: AWS Secrets Manager oder SSM Parameter Store (Policy-gesteuert)
- Container Registry: ECR (oder GHCR; Entscheidung offen)

## 4) Tech Stack (aktuell/angedacht)
### Frontend
- Web App: `apps/web` (Framework aktuell im Repo scaffolded)

### Backend
- Services: `services/auth`, `services/appointments`, `services/consultation`
- API-First: Contracts in `packages/contracts` (z. B. OpenAPI/DTOs)
- Shared: `packages/shared` (Utilities, Clients, Common Code)

### Infra / Delivery
- Terraform: `infra/terraform` (State, Network, später EKS/RDS/Secrets/Observability)
- Helm: `infra/helm` (Deployment Templates für Services)
- CI/CD: GitHub Actions
- Environments: staging als “first class citizen”, prod später mit Gate/Approval

## 5) Module / Features (Epics)
Diese Epics sind für Förder-/Antragstexte gut verwertbar:

1) Identity & Access (Auth)
- Benutzerregistrierung/Login
- Rollen/Permissions (Patient/Provider/Admin)
- Token/Session Management

2) Appointments
- Termin-Slots, Buchung, Storno
- Kalender-/Availability-Schnittstellen (später)

3) Consultation / Video
- Konsultations-Workflow (Start/Join/Ende)
- Videokonferenz-Integration (geplant: AWS Chime SDK “Skeleton in Staging”)

4) Notifications
- E-Mail/SMS/Push (später)
- Reminder, Status Updates

5) Platform / Infrastructure
- Cloud Landing Zone (Network, IAM, Secrets, Observability)
- Staging-first Deployments, IaC Parität

6) Security & Compliance (Querschnitt)
- Audit-Readiness, Dokumentationsstruktur, Security Controls
- Logging/Tracing ohne PII im Klartext
- Zugriff nach Least Privilege

## 6) Backlog-Schnitt (konkret, “Walking Skeleton” bis Staging)
### Sprint-1/2 Kandidaten (Top Stories)
- OIDC: GitHub Actions → AWS ohne Access Keys (AssumeRole)
- EKS Cluster in Staging (Private NodeGroups, öffentliche ALB)
- AWS Load Balancer Controller + Ingress für `apps/web` und 1 Service
- Container Build + Push (ECR/GHCR) + Helm Deploy nach Staging
- DB Grundstein: RDS Postgres (Subnet Group in private subnets, Security Groups)
- “Chime Skeleton”: Join/Create-Meeting API + Frontend Join Screen
- Observability Minimum: zentrale Logs + basic metrics
- Security Baseline: Secrets Manager/SSM, IAM Policies, VPC Flow Logs (optional)

## 7) Regulatorik-/Compliance-Leitplanken (für Antragstexte)
Diese Punkte sind wichtig als frühe “Guardrails”:

- MDR-Relevanz hängt an Zweckbestimmung: Software wird MDR-relevant, wenn sie vom Hersteller für einen medizinischen Zweck bestimmt ist. :contentReference[oaicite:0]{index=0}  
  → Empfehlung: Scope klar dokumentieren (MVP vs. spätere Clinical Decision Support Module).

- Audit-Readiness: In Telemedizin-Kontext können verschiedene Stellen Nachweise/Audits verlangen (z. B. gematik, KBV, Datenschutzbehörden, ggf. MDR/ISO13485). Empfohlen wird eine zentrale, versionierte Compliance-Dokumentationsstruktur und Mapping von Anforderungen zu Nachweisen. :contentReference[oaicite:1]{index=1}  

- Video-Anforderungen (wenn Abrechenbarkeit/Zertifizierungen relevant werden): u. a. keine Werbeeinblendungen, deutschsprachige UI/Patienteninfos, Datenschutz-/IT-Sicherheitsnachweise. :contentReference[oaicite:2]{index=2}  

- Resilienz/Backup: Best-Practice-Checkliste beinhaltet Backup-Strategie, Verschlüsselung, Restore-Tests, definierte RPO/RTO und DR-Runbooks. :contentReference[oaicite:3]{index=3}  

## 8) Offene Entscheidungen (für R&D hilfreich)
- EKS vs. ECS Fargate (EKS bevorzugt für Multi-Service + Helm + Platform Skalierung)
- Datenbank: RDS Postgres vs. Aurora Postgres
- Video: AWS Chime SDK (schnell integrierbar), ggf. später Zertifizierungs-/Provider-Fragen evaluieren
- Observability Stack: CloudWatch + OpenTelemetry vs. Prometheus/Grafana/ELK/Jaeger (hybrid möglich)

## 9) Repo Struktur (Ist-Zustand)
- README.md
- apps/web
- docs/adr, docs/architecture, docs/ways-of-working
- infra/helm
- infra/terraform
- packages/contracts
- packages/shared
- services/appointments
- services/auth
- services/consultation


## 10) Kontakt / Ownership
- Lead Dev / Projektleitung: Sadiq
- Ziel: Team-onboarding-ready (Repo Standards, IaC, Staging-first)