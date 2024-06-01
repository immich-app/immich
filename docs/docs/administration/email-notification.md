import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Email Notifications

Immich supports the option to send notifications via email, this option is supported for:

- Creating a new user .
- A user is added to a shared album (send email to the newly shared user).
- A shared album is added with new assets (send an email to all shared users beside the one that is adding assets).

The easiest way to set up a mail server for notifications is through Google, you may want to avoid using Gmail for privacy reasons or as part of your degoogle plan, you can use any SMTP server that can support login using name and password.

## Create an app password

First, it is recommended to create a dedicated Google account for your Immich instance, and not to mix it with your main Google account.

After you have created a new Google account we will have to:

- Add [2-Step Verification](https://support.google.com/accounts/answer/185839) to your Google account (Required)
- [Create an app password](https://support.google.com/accounts/answer/185833).

:::tip app password
For some people the app password will not be displayed even if you followed the instructions in the attached Google guide, if the option to create an app password does not appear for you, you can [click on this link to create an app password immediately](https://myaccount.google.com/apppasswords).
:::

There should be an Immich name for app passwords that you can easily understand in the future what you created app passwords for.

At the end of creating your app passwords, a password will be displayed, save it, it will be used for the identification information against the Gmail servers in Immich

<img src={require('./img/google-app-password.webp').default} width='50%' title="Authorised redirect URIs" />

<Tabs>
  <TabItem value="Computer" label="Computer" default>

## Setup in Immich

In Immich, enter the admin account -> Administration -> Settings -> Notification Settings

Under Email, enter the following details for connection with Gmail servers:

| Setting                   | Value                                                                          |
| :------------------------ | :----------------------------------------------------------------------------- |
| Host                      | `smtp.gmail.com`                                                               |
| Port                      | 587 (For TLS) 465 (For SSL)                                                    |
| Username                  | Your Google account address                                                    |
| Password                  | Your created password from Google app passwords page                           |
| Ignore certificate errors | Disable                                                                        |
| From address              | Sender email address, for example: "Immich Photo Server`<noreply@immich.app>`" |

</TabItem>
<TabItem value="Mobile" label="Mobile">

Immich does not allow this setting through the mobile app at this time.

</TabItem>
</Tabs>

---

Now for each new user created in the system, the system administrator will be able to choose whether to send an email informing the user of the new account.

:::danger plain password
Email messages sent by a user contain the login password you set as plain text, it is recommended to choose a password that is not too easy but not too personal. In any case, unless otherwise specified, the user will be asked to enter a new password when logging in.
:::

<img src={require('./img/immich-email-notefaction.webp').default} width='45%' title="Authorised redirect URIs" />
