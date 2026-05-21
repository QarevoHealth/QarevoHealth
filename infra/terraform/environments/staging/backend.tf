terraform {
  backend "s3" {
    bucket         = "qarevo-staging-tfstate"
    key            = "staging/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "qarevo-staging-tflock"
    encrypt        = true
  }
}