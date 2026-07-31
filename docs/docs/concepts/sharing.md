# Sharing

Immich has three distinct ways to give someone access to assets, and they differ in who the recipient is, how much of the library they reach, and what they can do with it.

| Mechanism       | Recipient                       | Scope                                     |
| --------------- | ------------------------------- | ----------------------------------------- |
| Shared album    | A user on the same instance     | The assets in that album                  |
| Partner sharing | A user on the same instance     | The sharer's entire library               |
| Public link     | Anyone with the URL, no account | The assets or album the link was made for |

## Shared albums

Albums can be shared between users on the same Immich instance. The shared users can view and add their own photos and videos to the shared album. When sharing an album, each user is assigned a permission — editor (read-write) or viewer (read-only).

## Partner sharing

Partner sharing allows you to share your _entire_ library with other users of your choice. They can then view your library and download the assets.

Partner sharing includes:

- Access to all non-archived and trashed photos and videos.
- Access to all metadata, including GPS information.
- Access to share assets via shared links, albums, etc.

Partner sharing does _not_ include:

- Already existing partner albums
- If an asset is favorited
- People and facial recognition data

:::note

- Partner sharing is one-way. To view your partner's assets, they must also share them with you.
- Partner sharing may result in displaying duplicate assets on the main timeline, as duplicates are only detected on a per-user basis.

:::

## Public links

You can create a public link to share a group of photos or videos, or an album, with anyone. The public link can be shared via email, social media, or any other method. There are a variety of options to customize the public link, such as setting an expiration date, password protection, and more. Public shared link is handy when you want to share a group of photos or videos with someone who doesn't have an Immich account and allow the shared user to upload their photos or videos to your account.

The public shared link is generated with a random URL, which acts as as a secret to avoid the link being guessed by unwanted parties, for instance.

A public link has no account behind it, so the URL itself is the credential. Immich generates a long random path for exactly this reason — the secret is the link, and anyone who obtains it has whatever access the link grants:

```
https://my.immich.app/share/JUckRMxlgpo7F9BpyqGk_cZEwDzaU_U5LU5_oNZp1ETIBa9dpQ0b5ghNm_22QVJfn3k
```

Because of that, links can be given an expiration date and a password, and the actions allowed through them can be restricted.

To create and configure them, see [Share photos and albums](/user-guide/share-photos-and-albums).
