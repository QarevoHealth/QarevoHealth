## Epics
1) Auth & IAM
2) Appointments
3) Consultation (inkl. Video)
4) Notifications
5) Platform/Infra (AWS/IaC/CI/CD)
6) Security & Compliance (Querschnitt)
7) Observability & Ops

## Initial Backlog (Top 20, “Staging Walking Skeleton”)
1. GitHub Actions → AWS OIDC (AssumeRole), no static keys
2. Terraform: EKS baseline (cluster + nodegroups)
3. Terraform: IAM for EKS (IRSA), cluster roles
4. Install AWS Load Balancer Controller
5. Ingress for web + one service (TLS optional later)
6. Build & push images (ECR/GHCR)
7. Helm chart skeleton for services
8. Deploy `auth` service to staging
9. Deploy `web` to staging (minimal)
10. Postgres RDS baseline + network policies
11. DB migrations framework (per service)
12. “Chime skeleton”: create/join meeting endpoint in `consultation`
13. Frontend: join meeting screen (placeholder UX)
14. Logging: centralized logs for services
15. Metrics: basic health metrics
16. Tracing: request correlation id
17. Secrets: move config to Secrets Manager/SSM
18. Security: baseline policies (least privilege), secret scanning
19. Runbook: basic “how to deploy / rollback”
20. Compliance folder structure (audit-ready mapping approach) :contentReference[oaicite:6]{index=6}
