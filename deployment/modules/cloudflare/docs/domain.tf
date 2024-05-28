resource "cloudflare_pages_domain" "immich_app_branch_domain" {
  account_id   = var.cloudflare_account_id
  project_name = data.terraform_remote_state.cloudflare_account.outputs.immich_app_pages_project_name
  domain       = "${var.prefix_name}.${local.deploy_domain_prefix}.immich.app"
}

resource "cloudflare_record" "immich_app_branch_subdomain" {
  name    = "${var.prefix_name}.${local.deploy_domain_prefix}.immich.app"
  proxied = true
  ttl     = 1
  type    = "CNAME"
  value   = "${replace(var.prefix_name, "/\\/|\\./", "-")}.${data.terraform_remote_state.cloudflare_account.outputs.immich_app_pages_project_subdomain}"
  zone_id = data.terraform_remote_state.cloudflare_account.outputs.immich_app_zone_id
}

output "immich_app_branch_subdomain" {
  value = cloudflare_record.immich_app_branch_subdomain.hostname
}
