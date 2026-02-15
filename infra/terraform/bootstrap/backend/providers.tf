provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "project" {
  type    = string
  default = "qarevo"
}

variable "env" {
  type    = string
  default = "staging"
}