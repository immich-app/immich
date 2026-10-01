# SMTP settings using Microsoft 365

:::info Deprecated by Microsoft
Microsoft has announced the [deprecation](https://techcommunity.microsoft.com/blog/exchange/updated-exchange-online-smtp-auth-basic-authentication-deprecation-timeline/4489835) of SMTP Basic Auth.
We no longer recommend using this setup method. Alternate methods are available but not within the scope of the Immich docs.
:::

This guide walks you through how to get the information you need to set up your Immich instance to send emails using Microsoft's SMTP server.

## Create an app password

You will need to generate an app password to use your Microsoft email in Immich. Depending on if you have a personal or business account, you can use https://go.microsoft.com/fwlink/?linkid=2274139 or https://myaccount.microsoft.com/securtiy-info respectively.

## Entering the SMTP credential in Immich

Entering your credential in Immich's email notification settings at `Administration -> Settings -> Notification Settings`

Host: smtp-mail.outlook.com
Port: 587
username: your mail address
Password: app password you created earlier
SMTPS: set it to disabled

<img src={require('./img/email-ms-settings.webp').default} width="80%" title="SMTP settings" />
