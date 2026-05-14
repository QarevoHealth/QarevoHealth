module "network" {
  source  = "../../modules/network"
  project = var.project
  env     = var.env
  cidr    = "10.20.0.0/16"
}