# 3-2-1 backup method

The 3-2-1 method is a widely used rule of thumb for how many copies of data to keep and where to keep them. It originates from photographer Peter Krogh's writing on digital asset management and is now common guidance across the backup industry.

A 3-2-1 backup means:

| Rule                     | Meaning                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **3** copies of the data | The live copy you use day to day, plus two backups.                                                                         |
| On **2** different media | The copies do not share a single point of failure — for example one disk plus one NAS, not two partitions of the same disk. |
| **1** copy off-site      | At least one copy is in a different physical location, so a fire, flood, or theft cannot destroy every copy.                |

The live copy counts as one of the three. Two backups on two separate devices, one of which is kept elsewhere, satisfies the rule.

## What does not count as a copy

- A second partition, dataset, or directory on the same physical disk.
- A RAID mirror. RAID protects against a disk failing; it does not protect against accidental deletion, corruption, ransomware, or the machine itself being destroyed, because every change is applied to all members immediately.
- A snapshot on the same filesystem as the original.
- A copy that is never verified. A backup whose restore has never been tested is not known to be a copy.

## Common variations

- **3-2-1-1-0** adds one copy that is offline, air-gapped, or immutable, and zero errors when the backup is verified.
- **4-3-2** raises the counts for data where the recovery requirements are stricter.

For how this applies to an Immich instance and what a complete Immich backup contains, see [Backups](/concepts/backups). For the mechanics of taking and restoring one, see [Backup and restore](/administration/back-up-and-restore).

Further reading: [The 3-2-1 backup strategy](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/).
