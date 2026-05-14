variable "project" {
  description = "Project name from root"
  type        = string
}

variable "env" {
  description = "Environment (dev/staging/prod)"
  type        = string
}

variable "vpc_id" {
  description = "The VPC ID from the network module"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the DB Subnet Group"
  type        = list(string)
}

# Sizing variables (Riya will confirm these)
variable "instance_class" {
  default = "db.t3.micro"
}