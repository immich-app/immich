# SMTP settings using Microsoft 365

This guide walks you through how to get the information you need to set up your Immich instance to send emails using Microsoft's SMTP server.

## Create an app password

There are different ways to create an app password, depending if you use a personal or business account. If you are using a personal account [use this Microsoft link](https://go.microsoft.com/fwlink/?linkid=2274139) to create an app password.

If you are using a school or business account, visit [https://myaccount.microsoft.com/securtiy-info](https://myaccount.microsoft.com/security-info), login, click on + Add sign-in method and then select "App password".

A password will be displayed; save it, it will be used for the password field when setting up the SMTP server in Immich.

## Entering the SMTP credential in Immich

Entering your credential in Immich's email notification settings at `Administration -> Settings -> Notification Settings`

Host: smtp-mail.outlook.com
Port: 587
username: your mail address
Password: app password you created earlier
SMTPS: set it to disabled

<img src={require('./img/email-ms-settings.webp').default} width="80%" title="SMTP settings" />

Maybe your account does not have SMTP enabled. To check your SMTP settings, follow [this link](https://support.microsoft.com/en-US/Outlook/pop-imap-and-smtp-settings-for-outlook-com).
