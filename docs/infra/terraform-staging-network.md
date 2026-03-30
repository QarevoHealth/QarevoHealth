# Terraform Staging Network (AWS)

## What was created
- Remote state: S3 bucket `qarevo-staging-tfstate`
- State lock: DynamoDB table `qarevo-staging-tflock`
- Staging network (eu-central-1):
  - VPC: `10.20.0.0/16`
  - 3 public subnets + 3 private subnets
  - Internet Gateway + NAT Gateway
  - Route tables for public/private subnets

## How to use
From `infra/terraform/environments/staging`:

1) Init backend:
```bash
terraform init \
  -backend-config="bucket=qarevo-staging-tfstate" \
  -backend-config="key=staging/terraform.tfstate" \
  -backend-config="region=eu-central-1" \
  -backend-config="dynamodb_table=qarevo-staging-tflock" \
  -backend-config="encrypt=true"
```

2) Plan/apply/output:
```bash
terraform plan
terraform apply

terraform output
```