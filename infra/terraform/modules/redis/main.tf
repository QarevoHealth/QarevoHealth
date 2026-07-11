locals {
  name_prefix = "${var.project}-${var.env}-redis"
}

# 1. Fetch VPC details dynamically for subnet verification
data "aws_vpc" "this" {
  id = var.vpc_id
}

# 2. Subnet Group: Bind Redis exclusively to private internal networks
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${local.name_prefix}-subnet-group"
  }
}

# 3. Security Group: Restrict access purely to internal VPC traffic
resource "aws_security_group" "redis" {
  name        = "${local.name_prefix}-sg"
  description = "Isolate Redis cache layer within the application private cloud"
  vpc_id      = var.vpc_id

  ingress {
    description = "Redis traffic from inside the VPC network"
    from_port   = 6379
    to_port     = 6379
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
    Name = "${local.name_prefix}-sg"
  }
}

# 4. Redis Replication Group Engine
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.name_prefix}-cluster"
  description          = "High-performance session and state caching engine for Qarevo"
  
  engine               = "redis"
  engine_version       = "7.1" # Fixed to current modern stable release
  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_clusters
  port                 = 6379

  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]

  # Security & Compliance Flags
  at_rest_encryption_enabled = true # Encrypts data cached to disk
  transit_encryption_enabled = true # Enforces TLS connection verification for in-flight cache data

  automatic_failover_enabled = var.env == "prod" ? true : false

  tags = {
    Name        = "${local.name_prefix}-cluster"
    Environment = var.env
  }
}