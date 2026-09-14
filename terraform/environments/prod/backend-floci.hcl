bucket                      = "signalscout-floci-terraform-state"
key                         = "prod/terraform.tfstate"
region                      = "ap-southeast-1"
endpoints                   = { s3 = "http://localhost:4566" }
use_path_style              = true
skip_credentials_validation = true
skip_metadata_api_check     = true
skip_requesting_account_id  = true
access_key                  = "test"
secret_key                  = "test"
