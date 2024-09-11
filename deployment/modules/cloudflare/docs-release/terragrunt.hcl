terraform {
  source = "."

  extra_arguments custom_vars {
    commands = get_terraform_commands_that_need_vars()
  }
}

include {
  path = find_in_parent_folders("state.hcl")
}

remote_state {
  backend = "pg"

  config = {
    conn_str = get_env("TF_STATE_POSTGRES_CONN_STR")
    schema_name = "prod_cloudflare_immich_app_docs_release"
  }
}
