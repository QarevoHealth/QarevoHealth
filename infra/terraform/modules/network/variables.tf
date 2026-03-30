variable "project" { type = string }
variable "env"     { type = string }
variable "cidr"    { type = string }
variable "az_count" {
  type    = number
  default = 3
}