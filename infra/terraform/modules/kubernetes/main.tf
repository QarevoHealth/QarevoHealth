locals {
  name_prefix = "${var.project}-${var.env}"
}

# 1. Create the core Kubernetes Master Control Plane Cluster
resource "aws_eks_cluster" "this" {
  name     = "${local.name_prefix}-eks"
  role_arn = "arn:aws:iam::123456789012:role/placeholder-eks-service-role" # Will link to IAM output later

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_public_access  = true # Allows you to run kubectl from your terminal
    endpoint_private_access = true
  }
}

# 2. Define the managed worker node pool (The actual machines executing code)
resource "aws_eks_node_group" "worker_nodes" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${local.name_prefix}-node-group"
  node_role_arn   = "arn:aws:iam::123456789012:role/placeholder-node-role" # Will link to IAM output later
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = var.env == "prod" ? 3 : 1
    max_size     = var.env == "prod" ? 6 : 2
    min_size     = 1
  }

  instance_types = ["t3.medium"] # Standard balancing for running backend API nodes

  tags = {
    Environment = var.env
  }
}