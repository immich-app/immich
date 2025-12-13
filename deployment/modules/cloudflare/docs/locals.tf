locals {
  domain_name = "immich.app"
  preview_prefix = contains(["branch", "pr"], var.prefix_event_type) ? "preview" : ""
  archive_prefix = contains(["release"], var.prefix_event_type) ? "archive" : ""
  deploy_domain_prefix = coalesce(local.preview_prefix, local.archive_prefix)
  is_release = contains(["release"], var.prefix_event_type)
}
