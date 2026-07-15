enum SortOrder {
  asc,
  desc;

  SortOrder reverse() {
    return this == SortOrder.asc ? SortOrder.desc : SortOrder.asc;
  }
}

enum TextSearchType { context, filename, description, ocr }

enum AssetVisibilityEnum { timeline, hidden, archive, locked }

enum ActionSource { timeline, viewer }

enum ShareAssetType { original, preview }

enum CleanupStep { selectDate, scan, delete }

enum AssetKeepType { none, photosOnly, videosOnly }

enum AssetDateAggregation { start, end }

enum SlideshowLook { contain, cover, blurredBackground }

enum SlideshowDirection { forward, backward, shuffle }

enum PartnerDirection { sharedBy, sharedWith }

enum TrashSyncStatus {
  pending,
  trashed,
  /* The asset was restored outside of Immich. The implications of this are:
   *  - Assets matching the same checksum won't be re-trashed
   *  - Backups will ignore the asset from re-uploading
   */
  dismissed,
  /* The asset was restored back out of the OS trash by us. This allows us
   * to copy the checksum back into the local asset table
   */
  restored,
}
