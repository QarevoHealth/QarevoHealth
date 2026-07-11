module "network" {
  source  = "../../modules/network"
  project = var.project
  env     = var.env
  cidr    = "10.20.0.0/16"
}

provider "aws" {
  region = "eu-central-1"
}

# Instantiate the Object Storage Module for Clinical Data Records
module "clinical_data_storage" {
  source = "../../modules/object_storage"

  project        = "qarevo"
  env            = "staging"
  bucket_purpose = "clinical-records"
}

# Instantiate a second bucket using the same module for Audio/Video Session Recordings
module "session_recordings_storage" {
  source = "../../modules/object_storage"

  project        = "qarevo"
  env            = "staging"
  bucket_purpose = "session-recordings"
}