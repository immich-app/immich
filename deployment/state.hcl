locals {
  cloudflare_account_id = get_env("CLOUDFLARE_ACCOUNT_ID")
  cloudflare_api_token  = get_env("CLOUDFLARE_API_TOKEN")

  tf_state_postgres_conn_str = get_env("TF_STATE_POSTGRES_CONN_STR")
}

remote_state {
  backend = "pg"

  config = {
    conn_str = local.tf_state_postgres_conn_str
  }
}

inputs = {
  cloudflare_account_id      = local.cloudflare_account_id
  cloudflare_api_token       = local.cloudflare_api_token
  tf_state_postgres_conn_str = local.tf_state_postgres_conn_str
}
