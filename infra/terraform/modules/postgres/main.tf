locals {
  # Adhering to the naming convention found in the network module
  name_prefix = "${var.project}-${var.env}"
}

# 1. Retrieve VPC details dynamically using the provided vpc_id
data "aws_vpc" "this" {
  id = var.vpc_id
}

# 2. Security Group: Isolate the Database
resource "aws_security_group" "postgres" {
  name        = "${local.name_prefix}-postgres-sg"
  description = "Allow inbound PostgreSQL traffic from within the VPC"
  vpc_id      = var.vpc_id

  ingress {
    description = "PostgreSQL access from VPC CIDR"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.this.cidr_block] 
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-postgres-sg"
  }
}

# 3. Subnet Group: Place DB in the Private Subnets
resource "aws_db_subnet_group" "postgres" {
  name       = "${local.name_prefix}-postgres-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${local.name_prefix}-postgres-subnet-group"
  }
}

# 4. The RDS Instance
resource "aws_db_instance" "postgres" {
  identifier             = "${local.name_prefix}-postgres"
  engine                 = "postgres"
  engine_version         = "17" # Pinned to current stable
  instance_class         = var.instance_class
  allocated_storage      = 20
  storage_type           = "gp3"
  
  db_name                = "qarevo_${var.env}"
  username               = "qarevo_admin"
  
  # AWS handles the secret generation natively (Zero-trust compliance)
  manage_master_user_password = true 
  
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.postgres.id]

  # Cost & Maintenance logic
  skip_final_snapshot    = var.env == "prod" ? false : true
  apply_immediately      = var.env == "prod" ? false : true
  
  tags = {
    Name = "${local.name_prefix}-postgres"
  }
}