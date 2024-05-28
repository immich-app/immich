resource "cloudflare_record" "immich_app_release_domain" {
  name = "immich.app"
  proxied = true
  ttl = 1
  type = "CNAME"
  value = data.terraform_remote_state.cloudflare_immich_app_docs.outputs.immich_app_branch_subdomain
  zone_id = data.terraform_remote_state.cloudflare_account.outputs.immich_app_zone_id
}
