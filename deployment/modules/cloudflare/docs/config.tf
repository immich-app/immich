terraform {
  backend "pg" {}
  required_version = "~> 1.7"

  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
      version = "4.43.0"
    }
  }
}
