variable "project" {
  type        = string
}

variable "env" {
  type        = string
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Subnets where the Kubernetes compute worker nodes will run"
}