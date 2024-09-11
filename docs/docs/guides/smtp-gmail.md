# SMTP settings using Gmail

This guide walks you through how to get the information you need to set up your Immich instance to send emails using Gmail's SMTP server.

## Create an app password

From your Google account settings

- Add [2-Step Verification](https://support.google.com/accounts/answer/185839) to your Google account (Required)
- [Create an app password](https://myaccount.google.com/apppasswords).

At the end of creating your app passwords, a password will be displayed; save it, it will be used for the password field when setting up the SMTP server in Immich.

<img src={require('./img/google-app-password.webp').default} title="Authorised redirect URIs" />

## Entering the SMTP credential in Immich

Entering your credential in Immich's email notification settings at `Administration -> Settings -> Notification Settings`

<img src={require('./img/email-settings.png').default} width="80%" title="SMTP settings" />
