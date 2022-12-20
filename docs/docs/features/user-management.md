---
sidebar_position: 4
---

# User Management

Immich supports multiple users, each with their own library.

## Register the Admin User

The first user to register will be the admin user. The admin user will be able to add other users to the application.

To register for the admin user, access the web application at `http://<machine-ip-address>:2283` and click on the **Getting Started** button.

<img src={require('./img/admin-registration-form.png').default} width="500" title="Admin Registration" />

Follow the prompts to register as the admin user and log in to the application.

## Create a New User

If you have friends or family members who want to use the application as well, you can create addition accounts. The default password is `password`, and the user can change their password after logging in to the application for the first time.

<img src={require('./img/create-new-user.png').default} title="Admin Registration" />

## Delete a User

If you need to remove a user from Immich, head to "Administration", where users can be scheduled for deletion. The user account will immediately become disabled and their library and all associated data will be removed after 7 days.
