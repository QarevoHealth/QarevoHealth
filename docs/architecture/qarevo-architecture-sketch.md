# Qarevo — Architektur-Skizze (Staging Zielbild)

## 1) Kontext
Ziel ist ein “Walking Skeleton” in Staging: Frontend + 1–2 Services + Auth-Flow + Video Skeleton + Observability Minimum.

## 2) High-Level Diagramm (Logisch)

```mermaid
flowchart TB
  U[User/Patient/Provider] -->|HTTPS| FE[Web App (apps/web)]
  FE -->|API calls| ALB[ALB Ingress / API Gateway Layer]
  ALB --> AUTH[Service: auth]
  ALB --> APPT[Service: appointments]
  ALB --> CONS[Service: consultation]

  AUTH --> DB[(Postgres - planned RDS/Aurora)]
  APPT --> DB
  CONS --> DB

  CONS -->|Create/Join meeting| CHIME[AWS Chime SDK (planned)]
  FE -->|Join meeting| CHIME

  subgraph AWS VPC (Staging)
    ALB
    AUTH
    APPT
    CONS
    DB
  end

  subgraph Observability (planned)
    LOGS[Central Logs]
    METRICS[Metrics]
    TRACES[Tracing]
  end

  AUTH --> LOGS
  APPT --> LOGS
  CONS --> LOGS
  AUTH --> METRICS
  CONS --> TRACES
