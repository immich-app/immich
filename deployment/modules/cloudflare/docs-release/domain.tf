resource "cloudflare_pages_domain" "immich_app_release_domain" {
  account_id   = var.cloudflare_account_id
  project_name = data.terraform_remote_state.cloudflare_account.outputs.immich_app_archive_pages_project_name
  domain       = "immich.app"
}

resource "cloudflare_record" "immich_app_release_domain" {
  name = "immich.app"
  proxied = true
  ttl = 1
  type = "CNAME"
  content = data.terraform_remote_state.cloudflare_immich_app_docs.outputs.immich_app_branch_pages_hostname
  zone_id = data.terraform_remote_state.cloudflare_account.outputs.immich_app_zone_id
}
