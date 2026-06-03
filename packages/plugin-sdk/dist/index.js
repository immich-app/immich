var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// ../../node_modules/.pnpm/@oazapfts+runtime@1.2.0/node_modules/@oazapfts/runtime/util.js
var a = [encodeURIComponent, encodeURIComponent];
function d(e, t2 = ",") {
  const o2 = (n, r) => {
    const c = e[r % e.length];
    return typeof n > "u" ? "" : typeof n == "object" ? Array.isArray(n) ? n.map(c).join(t2) : Object.entries(n).reduce(
      (i, f) => [...i, ...f],
      []
    ).map(c).join(t2) : c(l(n));
  };
  return (n, ...r) => n.reduce((c, u, i) => `${c}${u}${o2(r[i], i)}`, "");
}
function R(e = ",") {
  return (t2, o2 = a) => Object.entries(t2).filter(([, n]) => n !== void 0).map(([n, r]) => d(o2, e)`${n}=${r}`).join("&");
}
function j(...e) {
  return e.filter(Boolean).map((t2, o2) => o2 === 0 ? t2 : t2.replace(/^\/+/, "")).map((t2, o2, n) => o2 === n.length - 1 ? t2 : t2.replace(/\/+$/, "")).join("/");
}
function l(e) {
  return typeof e == "string" || typeof e == "number" || typeof e == "boolean" ? e : String(e);
}

// ../../node_modules/.pnpm/@oazapfts+runtime@1.2.0/node_modules/@oazapfts/runtime/query.js
var A = R();
var O = R("|");
var g = R("%20");

// ../../node_modules/.pnpm/@oazapfts+runtime@1.2.0/node_modules/@oazapfts/runtime/headers.js
function o(e, r) {
  const n = t(e);
  return t(r).forEach((i, s2) => {
    n.set(s2, i);
  }), n;
}
function t(e) {
  return e && !(e instanceof Headers) && !Array.isArray(e) ? new Headers(
    Object.fromEntries(
      Object.entries(e).filter(([, r]) => r != null).map(([r, n]) => [r, String(n)])
    )
  ) : new Headers(e);
}

// ../../node_modules/.pnpm/@oazapfts+runtime@1.2.0/node_modules/@oazapfts/runtime/index.js
function D(a2 = {}) {
  async function r(e, n) {
    const t2 = await p(e, n);
    let s2;
    try {
      s2 = await t2.text();
    } catch {
    }
    return {
      status: t2.status,
      headers: t2.headers,
      contentType: t2.headers.get("content-type"),
      data: s2
    };
  }
  async function i(e, n = {}) {
    const { status: t2, headers: s2, contentType: u, data: c } = await r(e, {
      ...n,
      headers: o(
        {
          Accept: "application/json"
        },
        n.headers
      )
    });
    return (u ? u.includes("json") : false) ? {
      status: t2,
      headers: s2,
      data: c ? JSON.parse(c) : null
    } : { status: t2, headers: s2, data: c };
  }
  async function f(e, n = {}) {
    const t2 = await p(e, n);
    let s2;
    try {
      s2 = await t2.blob();
    } catch {
    }
    return { status: t2.status, headers: t2.headers, data: s2 };
  }
  async function p(e, n = {}) {
    const {
      baseUrl: t2,
      fetch: s2,
      ...u
    } = {
      ...a2,
      ...n,
      headers: o(a2.headers, n.headers)
    }, c = j(t2, e);
    return await (s2 || fetch)(c, u);
  }
  return {
    ok: y,
    fetchText: r,
    fetchJson: i,
    fetchBlob: f,
    mergeHeaders: o,
    json({ body: e, headers: n, ...t2 }) {
      return {
        ...t2,
        ...e != null && { body: JSON.stringify(e) },
        headers: o(
          {
            "Content-Type": "application/json"
          },
          n
        )
      };
    },
    form({ body: e, headers: n, ...t2 }) {
      return {
        ...t2,
        ...e != null && { body: A(e) },
        headers: o(
          {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          n
        )
      };
    },
    multipart({ body: e, headers: n, ...t2 }) {
      if (e == null)
        return { ...t2, body: e, headers: t(n) };
      const s2 = new (t2.FormData || t2.formDataConstructor || a2.FormData || a2.formDataConstructor || FormData)(), u = (c, o2) => {
        typeof o2 == "string" || o2 instanceof Blob ? s2.append(c, o2) : typeof o2 == "number" || typeof o2 == "boolean" ? s2.append(c, String(o2)) : s2.append(
          c,
          new Blob([JSON.stringify(o2)], { type: "application/json" })
        );
      };
      return Object.entries(e).forEach(([c, o2]) => {
        Array.isArray(o2) ? o2.forEach((m) => u(c, m)) : u(c, o2);
      }), {
        ...t2,
        body: s2,
        headers: t(n)
      };
    }
  };
}
var j2 = [200, 201, 202, 204];
async function y(a2) {
  const r = await a2;
  if (j2.some((i) => i == r.status)) return r.data;
  throw new l2(r.status, r.data, r.headers);
}
var l2 = class extends Error {
  constructor(r, i, f) {
    super(`Error: ${r}`);
    __publicField(this, "status");
    __publicField(this, "data");
    __publicField(this, "headers");
    this.status = r, this.data = i, this.headers = f;
  }
};

// ../sdk/build/fetch-client.js
var defaults = {
  headers: {},
  baseUrl: "/api"
};
var oazapfts = D(defaults);
var ReactionLevel;
(function(ReactionLevel2) {
  ReactionLevel2["Album"] = "album";
  ReactionLevel2["Asset"] = "asset";
})(ReactionLevel || (ReactionLevel = {}));
var ReactionType;
(function(ReactionType2) {
  ReactionType2["Comment"] = "comment";
  ReactionType2["Like"] = "like";
})(ReactionType || (ReactionType = {}));
var UserAvatarColor;
(function(UserAvatarColor2) {
  UserAvatarColor2["Primary"] = "primary";
  UserAvatarColor2["Pink"] = "pink";
  UserAvatarColor2["Red"] = "red";
  UserAvatarColor2["Yellow"] = "yellow";
  UserAvatarColor2["Blue"] = "blue";
  UserAvatarColor2["Green"] = "green";
  UserAvatarColor2["Purple"] = "purple";
  UserAvatarColor2["Orange"] = "orange";
  UserAvatarColor2["Gray"] = "gray";
  UserAvatarColor2["Amber"] = "amber";
})(UserAvatarColor || (UserAvatarColor = {}));
var MaintenanceAction;
(function(MaintenanceAction2) {
  MaintenanceAction2["Start"] = "start";
  MaintenanceAction2["End"] = "end";
  MaintenanceAction2["SelectDatabaseRestore"] = "select_database_restore";
  MaintenanceAction2["RestoreDatabase"] = "restore_database";
})(MaintenanceAction || (MaintenanceAction = {}));
var StorageFolder;
(function(StorageFolder2) {
  StorageFolder2["EncodedVideo"] = "encoded-video";
  StorageFolder2["Library"] = "library";
  StorageFolder2["Upload"] = "upload";
  StorageFolder2["Profile"] = "profile";
  StorageFolder2["Thumbs"] = "thumbs";
  StorageFolder2["Backups"] = "backups";
})(StorageFolder || (StorageFolder = {}));
var NotificationLevel;
(function(NotificationLevel2) {
  NotificationLevel2["Success"] = "success";
  NotificationLevel2["Error"] = "error";
  NotificationLevel2["Warning"] = "warning";
  NotificationLevel2["Info"] = "info";
})(NotificationLevel || (NotificationLevel = {}));
var NotificationType;
(function(NotificationType2) {
  NotificationType2["JobFailed"] = "JobFailed";
  NotificationType2["BackupFailed"] = "BackupFailed";
  NotificationType2["SystemMessage"] = "SystemMessage";
  NotificationType2["AlbumInvite"] = "AlbumInvite";
  NotificationType2["AlbumUpdate"] = "AlbumUpdate";
  NotificationType2["Custom"] = "Custom";
})(NotificationType || (NotificationType = {}));
var UserStatus;
(function(UserStatus2) {
  UserStatus2["Active"] = "active";
  UserStatus2["Removing"] = "removing";
  UserStatus2["Deleted"] = "deleted";
})(UserStatus || (UserStatus = {}));
var AssetOrder;
(function(AssetOrder2) {
  AssetOrder2["Asc"] = "asc";
  AssetOrder2["Desc"] = "desc";
})(AssetOrder || (AssetOrder = {}));
var AssetVisibility;
(function(AssetVisibility2) {
  AssetVisibility2["Archive"] = "archive";
  AssetVisibility2["Timeline"] = "timeline";
  AssetVisibility2["Hidden"] = "hidden";
  AssetVisibility2["Locked"] = "locked";
})(AssetVisibility || (AssetVisibility = {}));
var AlbumUserRole;
(function(AlbumUserRole2) {
  AlbumUserRole2["Editor"] = "editor";
  AlbumUserRole2["Owner"] = "owner";
  AlbumUserRole2["Viewer"] = "viewer";
})(AlbumUserRole || (AlbumUserRole = {}));
var BulkIdErrorReason;
(function(BulkIdErrorReason2) {
  BulkIdErrorReason2["Duplicate"] = "duplicate";
  BulkIdErrorReason2["NoPermission"] = "no_permission";
  BulkIdErrorReason2["NotFound"] = "not_found";
  BulkIdErrorReason2["Unknown"] = "unknown";
  BulkIdErrorReason2["Validation"] = "validation";
})(BulkIdErrorReason || (BulkIdErrorReason = {}));
var Permission;
(function(Permission2) {
  Permission2["All"] = "all";
  Permission2["ActivityCreate"] = "activity.create";
  Permission2["ActivityRead"] = "activity.read";
  Permission2["ActivityUpdate"] = "activity.update";
  Permission2["ActivityDelete"] = "activity.delete";
  Permission2["ActivityStatistics"] = "activity.statistics";
  Permission2["ApiKeyCreate"] = "apiKey.create";
  Permission2["ApiKeyRead"] = "apiKey.read";
  Permission2["ApiKeyUpdate"] = "apiKey.update";
  Permission2["ApiKeyDelete"] = "apiKey.delete";
  Permission2["AssetRead"] = "asset.read";
  Permission2["AssetUpdate"] = "asset.update";
  Permission2["AssetDelete"] = "asset.delete";
  Permission2["AssetStatistics"] = "asset.statistics";
  Permission2["AssetShare"] = "asset.share";
  Permission2["AssetView"] = "asset.view";
  Permission2["AssetDownload"] = "asset.download";
  Permission2["AssetUpload"] = "asset.upload";
  Permission2["AssetCopy"] = "asset.copy";
  Permission2["AssetDerive"] = "asset.derive";
  Permission2["AssetEditGet"] = "asset.edit.get";
  Permission2["AssetEditCreate"] = "asset.edit.create";
  Permission2["AssetEditDelete"] = "asset.edit.delete";
  Permission2["AlbumCreate"] = "album.create";
  Permission2["AlbumRead"] = "album.read";
  Permission2["AlbumUpdate"] = "album.update";
  Permission2["AlbumDelete"] = "album.delete";
  Permission2["AlbumStatistics"] = "album.statistics";
  Permission2["AlbumShare"] = "album.share";
  Permission2["AlbumDownload"] = "album.download";
  Permission2["AlbumAssetCreate"] = "albumAsset.create";
  Permission2["AlbumAssetDelete"] = "albumAsset.delete";
  Permission2["AlbumUserCreate"] = "albumUser.create";
  Permission2["AlbumUserUpdate"] = "albumUser.update";
  Permission2["AlbumUserDelete"] = "albumUser.delete";
  Permission2["AuthChangePassword"] = "auth.changePassword";
  Permission2["AuthDeviceDelete"] = "authDevice.delete";
  Permission2["ArchiveRead"] = "archive.read";
  Permission2["BackupList"] = "backup.list";
  Permission2["BackupDownload"] = "backup.download";
  Permission2["BackupUpload"] = "backup.upload";
  Permission2["BackupDelete"] = "backup.delete";
  Permission2["DuplicateRead"] = "duplicate.read";
  Permission2["DuplicateDelete"] = "duplicate.delete";
  Permission2["FaceCreate"] = "face.create";
  Permission2["FaceRead"] = "face.read";
  Permission2["FaceUpdate"] = "face.update";
  Permission2["FaceDelete"] = "face.delete";
  Permission2["FolderRead"] = "folder.read";
  Permission2["JobCreate"] = "job.create";
  Permission2["JobRead"] = "job.read";
  Permission2["LibraryCreate"] = "library.create";
  Permission2["LibraryRead"] = "library.read";
  Permission2["LibraryUpdate"] = "library.update";
  Permission2["LibraryDelete"] = "library.delete";
  Permission2["LibraryStatistics"] = "library.statistics";
  Permission2["TimelineRead"] = "timeline.read";
  Permission2["TimelineDownload"] = "timeline.download";
  Permission2["Maintenance"] = "maintenance";
  Permission2["MapRead"] = "map.read";
  Permission2["MapSearch"] = "map.search";
  Permission2["MemoryCreate"] = "memory.create";
  Permission2["MemoryRead"] = "memory.read";
  Permission2["MemoryUpdate"] = "memory.update";
  Permission2["MemoryDelete"] = "memory.delete";
  Permission2["MemoryStatistics"] = "memory.statistics";
  Permission2["MemoryAssetCreate"] = "memoryAsset.create";
  Permission2["MemoryAssetDelete"] = "memoryAsset.delete";
  Permission2["NotificationCreate"] = "notification.create";
  Permission2["NotificationRead"] = "notification.read";
  Permission2["NotificationUpdate"] = "notification.update";
  Permission2["NotificationDelete"] = "notification.delete";
  Permission2["PartnerCreate"] = "partner.create";
  Permission2["PartnerRead"] = "partner.read";
  Permission2["PartnerUpdate"] = "partner.update";
  Permission2["PartnerDelete"] = "partner.delete";
  Permission2["PersonCreate"] = "person.create";
  Permission2["PersonRead"] = "person.read";
  Permission2["PersonUpdate"] = "person.update";
  Permission2["PersonDelete"] = "person.delete";
  Permission2["PersonStatistics"] = "person.statistics";
  Permission2["PersonMerge"] = "person.merge";
  Permission2["PersonReassign"] = "person.reassign";
  Permission2["PinCodeCreate"] = "pinCode.create";
  Permission2["PinCodeUpdate"] = "pinCode.update";
  Permission2["PinCodeDelete"] = "pinCode.delete";
  Permission2["PluginCreate"] = "plugin.create";
  Permission2["PluginRead"] = "plugin.read";
  Permission2["PluginUpdate"] = "plugin.update";
  Permission2["PluginDelete"] = "plugin.delete";
  Permission2["ServerAbout"] = "server.about";
  Permission2["ServerApkLinks"] = "server.apkLinks";
  Permission2["ServerStorage"] = "server.storage";
  Permission2["ServerStatistics"] = "server.statistics";
  Permission2["ServerVersionCheck"] = "server.versionCheck";
  Permission2["ServerLicenseRead"] = "serverLicense.read";
  Permission2["ServerLicenseUpdate"] = "serverLicense.update";
  Permission2["ServerLicenseDelete"] = "serverLicense.delete";
  Permission2["SessionCreate"] = "session.create";
  Permission2["SessionRead"] = "session.read";
  Permission2["SessionUpdate"] = "session.update";
  Permission2["SessionDelete"] = "session.delete";
  Permission2["SessionLock"] = "session.lock";
  Permission2["SharedLinkCreate"] = "sharedLink.create";
  Permission2["SharedLinkRead"] = "sharedLink.read";
  Permission2["SharedLinkUpdate"] = "sharedLink.update";
  Permission2["SharedLinkDelete"] = "sharedLink.delete";
  Permission2["StackCreate"] = "stack.create";
  Permission2["StackRead"] = "stack.read";
  Permission2["StackUpdate"] = "stack.update";
  Permission2["StackDelete"] = "stack.delete";
  Permission2["SyncStream"] = "sync.stream";
  Permission2["SyncCheckpointRead"] = "syncCheckpoint.read";
  Permission2["SyncCheckpointUpdate"] = "syncCheckpoint.update";
  Permission2["SyncCheckpointDelete"] = "syncCheckpoint.delete";
  Permission2["SystemConfigRead"] = "systemConfig.read";
  Permission2["SystemConfigUpdate"] = "systemConfig.update";
  Permission2["SystemMetadataRead"] = "systemMetadata.read";
  Permission2["SystemMetadataUpdate"] = "systemMetadata.update";
  Permission2["TagCreate"] = "tag.create";
  Permission2["TagRead"] = "tag.read";
  Permission2["TagUpdate"] = "tag.update";
  Permission2["TagDelete"] = "tag.delete";
  Permission2["TagAsset"] = "tag.asset";
  Permission2["UserRead"] = "user.read";
  Permission2["UserUpdate"] = "user.update";
  Permission2["UserLicenseCreate"] = "userLicense.create";
  Permission2["UserLicenseRead"] = "userLicense.read";
  Permission2["UserLicenseUpdate"] = "userLicense.update";
  Permission2["UserLicenseDelete"] = "userLicense.delete";
  Permission2["UserOnboardingRead"] = "userOnboarding.read";
  Permission2["UserOnboardingUpdate"] = "userOnboarding.update";
  Permission2["UserOnboardingDelete"] = "userOnboarding.delete";
  Permission2["UserPreferenceRead"] = "userPreference.read";
  Permission2["UserPreferenceUpdate"] = "userPreference.update";
  Permission2["UserProfileImageCreate"] = "userProfileImage.create";
  Permission2["UserProfileImageRead"] = "userProfileImage.read";
  Permission2["UserProfileImageUpdate"] = "userProfileImage.update";
  Permission2["UserProfileImageDelete"] = "userProfileImage.delete";
  Permission2["QueueRead"] = "queue.read";
  Permission2["QueueUpdate"] = "queue.update";
  Permission2["QueueJobCreate"] = "queueJob.create";
  Permission2["QueueJobRead"] = "queueJob.read";
  Permission2["QueueJobUpdate"] = "queueJob.update";
  Permission2["QueueJobDelete"] = "queueJob.delete";
  Permission2["WorkflowCreate"] = "workflow.create";
  Permission2["WorkflowRead"] = "workflow.read";
  Permission2["WorkflowUpdate"] = "workflow.update";
  Permission2["WorkflowDelete"] = "workflow.delete";
  Permission2["AdminUserCreate"] = "adminUser.create";
  Permission2["AdminUserRead"] = "adminUser.read";
  Permission2["AdminUserUpdate"] = "adminUser.update";
  Permission2["AdminUserDelete"] = "adminUser.delete";
  Permission2["AdminSessionRead"] = "adminSession.read";
  Permission2["AdminAuthUnlinkAll"] = "adminAuth.unlinkAll";
})(Permission || (Permission = {}));
var AssetMediaStatus;
(function(AssetMediaStatus2) {
  AssetMediaStatus2["Created"] = "created";
  AssetMediaStatus2["Duplicate"] = "duplicate";
})(AssetMediaStatus || (AssetMediaStatus = {}));
var AssetUploadAction;
(function(AssetUploadAction2) {
  AssetUploadAction2["Accept"] = "accept";
  AssetUploadAction2["Reject"] = "reject";
})(AssetUploadAction || (AssetUploadAction = {}));
var AssetRejectReason;
(function(AssetRejectReason2) {
  AssetRejectReason2["Duplicate"] = "duplicate";
  AssetRejectReason2["UnsupportedFormat"] = "unsupported-format";
})(AssetRejectReason || (AssetRejectReason = {}));
var AssetJobName;
(function(AssetJobName2) {
  AssetJobName2["RefreshFaces"] = "refresh-faces";
  AssetJobName2["RefreshMetadata"] = "refresh-metadata";
  AssetJobName2["RegenerateThumbnail"] = "regenerate-thumbnail";
  AssetJobName2["TranscodeVideo"] = "transcode-video";
})(AssetJobName || (AssetJobName = {}));
var AssetTypeEnum;
(function(AssetTypeEnum2) {
  AssetTypeEnum2["Image"] = "IMAGE";
  AssetTypeEnum2["Video"] = "VIDEO";
  AssetTypeEnum2["Audio"] = "AUDIO";
  AssetTypeEnum2["Other"] = "OTHER";
})(AssetTypeEnum || (AssetTypeEnum = {}));
var AssetEditAction;
(function(AssetEditAction2) {
  AssetEditAction2["Crop"] = "crop";
  AssetEditAction2["Rotate"] = "rotate";
  AssetEditAction2["Mirror"] = "mirror";
})(AssetEditAction || (AssetEditAction = {}));
var MirrorAxis;
(function(MirrorAxis2) {
  MirrorAxis2["Horizontal"] = "horizontal";
  MirrorAxis2["Vertical"] = "vertical";
})(MirrorAxis || (MirrorAxis = {}));
var AssetMediaSize;
(function(AssetMediaSize2) {
  AssetMediaSize2["Original"] = "original";
  AssetMediaSize2["Fullsize"] = "fullsize";
  AssetMediaSize2["Preview"] = "preview";
  AssetMediaSize2["Thumbnail"] = "thumbnail";
})(AssetMediaSize || (AssetMediaSize = {}));
var SourceType;
(function(SourceType2) {
  SourceType2["MachineLearning"] = "machine-learning";
  SourceType2["Exif"] = "exif";
  SourceType2["Manual"] = "manual";
})(SourceType || (SourceType = {}));
var ManualJobName;
(function(ManualJobName2) {
  ManualJobName2["PersonCleanup"] = "person-cleanup";
  ManualJobName2["TagCleanup"] = "tag-cleanup";
  ManualJobName2["UserCleanup"] = "user-cleanup";
  ManualJobName2["MemoryCleanup"] = "memory-cleanup";
  ManualJobName2["MemoryCreate"] = "memory-create";
  ManualJobName2["BackupDatabase"] = "backup-database";
})(ManualJobName || (ManualJobName = {}));
var QueueName;
(function(QueueName2) {
  QueueName2["ThumbnailGeneration"] = "thumbnailGeneration";
  QueueName2["MetadataExtraction"] = "metadataExtraction";
  QueueName2["VideoConversion"] = "videoConversion";
  QueueName2["FaceDetection"] = "faceDetection";
  QueueName2["FacialRecognition"] = "facialRecognition";
  QueueName2["SmartSearch"] = "smartSearch";
  QueueName2["DuplicateDetection"] = "duplicateDetection";
  QueueName2["BackgroundTask"] = "backgroundTask";
  QueueName2["StorageTemplateMigration"] = "storageTemplateMigration";
  QueueName2["Migration"] = "migration";
  QueueName2["Search"] = "search";
  QueueName2["Sidecar"] = "sidecar";
  QueueName2["Library"] = "library";
  QueueName2["Notifications"] = "notifications";
  QueueName2["BackupDatabase"] = "backupDatabase";
  QueueName2["Ocr"] = "ocr";
  QueueName2["Workflow"] = "workflow";
  QueueName2["Editor"] = "editor";
})(QueueName || (QueueName = {}));
var QueueCommand;
(function(QueueCommand2) {
  QueueCommand2["Start"] = "start";
  QueueCommand2["Pause"] = "pause";
  QueueCommand2["Resume"] = "resume";
  QueueCommand2["Empty"] = "empty";
  QueueCommand2["ClearFailed"] = "clear-failed";
})(QueueCommand || (QueueCommand = {}));
var MemorySearchOrder;
(function(MemorySearchOrder2) {
  MemorySearchOrder2["Asc"] = "asc";
  MemorySearchOrder2["Desc"] = "desc";
  MemorySearchOrder2["Random"] = "random";
})(MemorySearchOrder || (MemorySearchOrder = {}));
var MemoryType;
(function(MemoryType2) {
  MemoryType2["OnThisDay"] = "on_this_day";
})(MemoryType || (MemoryType = {}));
var PartnerDirection;
(function(PartnerDirection2) {
  PartnerDirection2["SharedBy"] = "shared-by";
  PartnerDirection2["SharedWith"] = "shared-with";
})(PartnerDirection || (PartnerDirection = {}));
var WorkflowType;
(function(WorkflowType2) {
  WorkflowType2["AssetV1"] = "AssetV1";
  WorkflowType2["AssetPersonV1"] = "AssetPersonV1";
})(WorkflowType || (WorkflowType = {}));
var WorkflowTrigger;
(function(WorkflowTrigger3) {
  WorkflowTrigger3["AssetCreate"] = "AssetCreate";
  WorkflowTrigger3["AssetMetadataExtraction"] = "AssetMetadataExtraction";
  WorkflowTrigger3["PersonRecognized"] = "PersonRecognized";
})(WorkflowTrigger || (WorkflowTrigger = {}));
var QueueJobStatus;
(function(QueueJobStatus2) {
  QueueJobStatus2["Active"] = "active";
  QueueJobStatus2["Failed"] = "failed";
  QueueJobStatus2["Completed"] = "completed";
  QueueJobStatus2["Delayed"] = "delayed";
  QueueJobStatus2["Waiting"] = "waiting";
  QueueJobStatus2["Paused"] = "paused";
})(QueueJobStatus || (QueueJobStatus = {}));
var JobName;
(function(JobName2) {
  JobName2["AssetDelete"] = "AssetDelete";
  JobName2["AssetDeleteCheck"] = "AssetDeleteCheck";
  JobName2["AssetDetectFacesQueueAll"] = "AssetDetectFacesQueueAll";
  JobName2["AssetDetectFaces"] = "AssetDetectFaces";
  JobName2["AssetDetectDuplicatesQueueAll"] = "AssetDetectDuplicatesQueueAll";
  JobName2["AssetDetectDuplicates"] = "AssetDetectDuplicates";
  JobName2["AssetEditThumbnailGeneration"] = "AssetEditThumbnailGeneration";
  JobName2["AssetEncodeVideoQueueAll"] = "AssetEncodeVideoQueueAll";
  JobName2["AssetEncodeVideo"] = "AssetEncodeVideo";
  JobName2["AssetEmptyTrash"] = "AssetEmptyTrash";
  JobName2["AssetExtractMetadataQueueAll"] = "AssetExtractMetadataQueueAll";
  JobName2["AssetExtractMetadata"] = "AssetExtractMetadata";
  JobName2["AssetFileMigration"] = "AssetFileMigration";
  JobName2["AssetGenerateThumbnailsQueueAll"] = "AssetGenerateThumbnailsQueueAll";
  JobName2["AssetGenerateThumbnails"] = "AssetGenerateThumbnails";
  JobName2["AuditTableCleanup"] = "AuditTableCleanup";
  JobName2["DatabaseBackup"] = "DatabaseBackup";
  JobName2["FacialRecognitionQueueAll"] = "FacialRecognitionQueueAll";
  JobName2["FacialRecognition"] = "FacialRecognition";
  JobName2["FileDelete"] = "FileDelete";
  JobName2["FileMigrationQueueAll"] = "FileMigrationQueueAll";
  JobName2["LibraryDeleteCheck"] = "LibraryDeleteCheck";
  JobName2["LibraryDelete"] = "LibraryDelete";
  JobName2["LibraryRemoveAsset"] = "LibraryRemoveAsset";
  JobName2["LibraryScanAssetsQueueAll"] = "LibraryScanAssetsQueueAll";
  JobName2["LibrarySyncAssets"] = "LibrarySyncAssets";
  JobName2["LibrarySyncFilesQueueAll"] = "LibrarySyncFilesQueueAll";
  JobName2["LibrarySyncFiles"] = "LibrarySyncFiles";
  JobName2["LibraryScanQueueAll"] = "LibraryScanQueueAll";
  JobName2["MemoryCleanup"] = "MemoryCleanup";
  JobName2["MemoryGenerate"] = "MemoryGenerate";
  JobName2["NotificationsCleanup"] = "NotificationsCleanup";
  JobName2["NotifyUserSignup"] = "NotifyUserSignup";
  JobName2["NotifyAlbumInvite"] = "NotifyAlbumInvite";
  JobName2["NotifyAlbumUpdate"] = "NotifyAlbumUpdate";
  JobName2["UserDelete"] = "UserDelete";
  JobName2["UserDeleteCheck"] = "UserDeleteCheck";
  JobName2["UserSyncUsage"] = "UserSyncUsage";
  JobName2["PersonCleanup"] = "PersonCleanup";
  JobName2["PersonFileMigration"] = "PersonFileMigration";
  JobName2["PersonGenerateThumbnail"] = "PersonGenerateThumbnail";
  JobName2["SessionCleanup"] = "SessionCleanup";
  JobName2["SendMail"] = "SendMail";
  JobName2["SidecarQueueAll"] = "SidecarQueueAll";
  JobName2["SidecarCheck"] = "SidecarCheck";
  JobName2["SidecarWrite"] = "SidecarWrite";
  JobName2["SmartSearchQueueAll"] = "SmartSearchQueueAll";
  JobName2["SmartSearch"] = "SmartSearch";
  JobName2["StorageTemplateMigration"] = "StorageTemplateMigration";
  JobName2["StorageTemplateMigrationSingle"] = "StorageTemplateMigrationSingle";
  JobName2["TagCleanup"] = "TagCleanup";
  JobName2["VersionCheck"] = "VersionCheck";
  JobName2["OcrQueueAll"] = "OcrQueueAll";
  JobName2["Ocr"] = "Ocr";
  JobName2["WorkflowAssetTrigger"] = "WorkflowAssetTrigger";
})(JobName || (JobName = {}));
var SearchSuggestionType;
(function(SearchSuggestionType2) {
  SearchSuggestionType2["Country"] = "country";
  SearchSuggestionType2["State"] = "state";
  SearchSuggestionType2["City"] = "city";
  SearchSuggestionType2["CameraMake"] = "camera-make";
  SearchSuggestionType2["CameraModel"] = "camera-model";
  SearchSuggestionType2["CameraLensModel"] = "camera-lens-model";
})(SearchSuggestionType || (SearchSuggestionType = {}));
var SharedLinkType;
(function(SharedLinkType2) {
  SharedLinkType2["Album"] = "ALBUM";
  SharedLinkType2["Individual"] = "INDIVIDUAL";
})(SharedLinkType || (SharedLinkType = {}));
var AssetIdErrorReason;
(function(AssetIdErrorReason2) {
  AssetIdErrorReason2["Duplicate"] = "duplicate";
  AssetIdErrorReason2["NoPermission"] = "no_permission";
  AssetIdErrorReason2["NotFound"] = "not_found";
})(AssetIdErrorReason || (AssetIdErrorReason = {}));
var SyncEntityType;
(function(SyncEntityType2) {
  SyncEntityType2["AuthUserV1"] = "AuthUserV1";
  SyncEntityType2["UserV1"] = "UserV1";
  SyncEntityType2["UserDeleteV1"] = "UserDeleteV1";
  SyncEntityType2["AssetV1"] = "AssetV1";
  SyncEntityType2["AssetV2"] = "AssetV2";
  SyncEntityType2["AssetDeleteV1"] = "AssetDeleteV1";
  SyncEntityType2["AssetExifV1"] = "AssetExifV1";
  SyncEntityType2["AssetEditV1"] = "AssetEditV1";
  SyncEntityType2["AssetEditDeleteV1"] = "AssetEditDeleteV1";
  SyncEntityType2["AssetMetadataV1"] = "AssetMetadataV1";
  SyncEntityType2["AssetMetadataDeleteV1"] = "AssetMetadataDeleteV1";
  SyncEntityType2["PartnerV1"] = "PartnerV1";
  SyncEntityType2["PartnerDeleteV1"] = "PartnerDeleteV1";
  SyncEntityType2["PartnerAssetV1"] = "PartnerAssetV1";
  SyncEntityType2["PartnerAssetV2"] = "PartnerAssetV2";
  SyncEntityType2["PartnerAssetBackfillV1"] = "PartnerAssetBackfillV1";
  SyncEntityType2["PartnerAssetBackfillV2"] = "PartnerAssetBackfillV2";
  SyncEntityType2["PartnerAssetDeleteV1"] = "PartnerAssetDeleteV1";
  SyncEntityType2["PartnerAssetExifV1"] = "PartnerAssetExifV1";
  SyncEntityType2["PartnerAssetExifBackfillV1"] = "PartnerAssetExifBackfillV1";
  SyncEntityType2["PartnerStackBackfillV1"] = "PartnerStackBackfillV1";
  SyncEntityType2["PartnerStackDeleteV1"] = "PartnerStackDeleteV1";
  SyncEntityType2["PartnerStackV1"] = "PartnerStackV1";
  SyncEntityType2["AlbumV1"] = "AlbumV1";
  SyncEntityType2["AlbumV2"] = "AlbumV2";
  SyncEntityType2["AlbumDeleteV1"] = "AlbumDeleteV1";
  SyncEntityType2["AlbumUserV1"] = "AlbumUserV1";
  SyncEntityType2["AlbumUserBackfillV1"] = "AlbumUserBackfillV1";
  SyncEntityType2["AlbumUserDeleteV1"] = "AlbumUserDeleteV1";
  SyncEntityType2["AlbumAssetCreateV1"] = "AlbumAssetCreateV1";
  SyncEntityType2["AlbumAssetCreateV2"] = "AlbumAssetCreateV2";
  SyncEntityType2["AlbumAssetUpdateV1"] = "AlbumAssetUpdateV1";
  SyncEntityType2["AlbumAssetUpdateV2"] = "AlbumAssetUpdateV2";
  SyncEntityType2["AlbumAssetBackfillV1"] = "AlbumAssetBackfillV1";
  SyncEntityType2["AlbumAssetBackfillV2"] = "AlbumAssetBackfillV2";
  SyncEntityType2["AlbumAssetExifCreateV1"] = "AlbumAssetExifCreateV1";
  SyncEntityType2["AlbumAssetExifUpdateV1"] = "AlbumAssetExifUpdateV1";
  SyncEntityType2["AlbumAssetExifBackfillV1"] = "AlbumAssetExifBackfillV1";
  SyncEntityType2["AlbumToAssetV1"] = "AlbumToAssetV1";
  SyncEntityType2["AlbumToAssetDeleteV1"] = "AlbumToAssetDeleteV1";
  SyncEntityType2["AlbumToAssetBackfillV1"] = "AlbumToAssetBackfillV1";
  SyncEntityType2["MemoryV1"] = "MemoryV1";
  SyncEntityType2["MemoryDeleteV1"] = "MemoryDeleteV1";
  SyncEntityType2["MemoryToAssetV1"] = "MemoryToAssetV1";
  SyncEntityType2["MemoryToAssetDeleteV1"] = "MemoryToAssetDeleteV1";
  SyncEntityType2["StackV1"] = "StackV1";
  SyncEntityType2["StackDeleteV1"] = "StackDeleteV1";
  SyncEntityType2["PersonV1"] = "PersonV1";
  SyncEntityType2["PersonDeleteV1"] = "PersonDeleteV1";
  SyncEntityType2["AssetFaceV1"] = "AssetFaceV1";
  SyncEntityType2["AssetFaceV2"] = "AssetFaceV2";
  SyncEntityType2["AssetFaceDeleteV1"] = "AssetFaceDeleteV1";
  SyncEntityType2["UserMetadataV1"] = "UserMetadataV1";
  SyncEntityType2["UserMetadataDeleteV1"] = "UserMetadataDeleteV1";
  SyncEntityType2["SyncAckV1"] = "SyncAckV1";
  SyncEntityType2["SyncResetV1"] = "SyncResetV1";
  SyncEntityType2["SyncCompleteV1"] = "SyncCompleteV1";
})(SyncEntityType || (SyncEntityType = {}));
var SyncRequestType;
(function(SyncRequestType2) {
  SyncRequestType2["AlbumsV1"] = "AlbumsV1";
  SyncRequestType2["AlbumsV2"] = "AlbumsV2";
  SyncRequestType2["AlbumUsersV1"] = "AlbumUsersV1";
  SyncRequestType2["AlbumToAssetsV1"] = "AlbumToAssetsV1";
  SyncRequestType2["AlbumAssetsV1"] = "AlbumAssetsV1";
  SyncRequestType2["AlbumAssetsV2"] = "AlbumAssetsV2";
  SyncRequestType2["AlbumAssetExifsV1"] = "AlbumAssetExifsV1";
  SyncRequestType2["AssetsV1"] = "AssetsV1";
  SyncRequestType2["AssetsV2"] = "AssetsV2";
  SyncRequestType2["AssetExifsV1"] = "AssetExifsV1";
  SyncRequestType2["AssetEditsV1"] = "AssetEditsV1";
  SyncRequestType2["AssetMetadataV1"] = "AssetMetadataV1";
  SyncRequestType2["AuthUsersV1"] = "AuthUsersV1";
  SyncRequestType2["MemoriesV1"] = "MemoriesV1";
  SyncRequestType2["MemoryToAssetsV1"] = "MemoryToAssetsV1";
  SyncRequestType2["PartnersV1"] = "PartnersV1";
  SyncRequestType2["PartnerAssetsV1"] = "PartnerAssetsV1";
  SyncRequestType2["PartnerAssetsV2"] = "PartnerAssetsV2";
  SyncRequestType2["PartnerAssetExifsV1"] = "PartnerAssetExifsV1";
  SyncRequestType2["PartnerStacksV1"] = "PartnerStacksV1";
  SyncRequestType2["StacksV1"] = "StacksV1";
  SyncRequestType2["UsersV1"] = "UsersV1";
  SyncRequestType2["PeopleV1"] = "PeopleV1";
  SyncRequestType2["AssetFacesV1"] = "AssetFacesV1";
  SyncRequestType2["AssetFacesV2"] = "AssetFacesV2";
  SyncRequestType2["UserMetadataV1"] = "UserMetadataV1";
})(SyncRequestType || (SyncRequestType = {}));
var TranscodeHWAccel;
(function(TranscodeHWAccel2) {
  TranscodeHWAccel2["Nvenc"] = "nvenc";
  TranscodeHWAccel2["Qsv"] = "qsv";
  TranscodeHWAccel2["Vaapi"] = "vaapi";
  TranscodeHWAccel2["Rkmpp"] = "rkmpp";
  TranscodeHWAccel2["Disabled"] = "disabled";
})(TranscodeHWAccel || (TranscodeHWAccel = {}));
var AudioCodec;
(function(AudioCodec2) {
  AudioCodec2["Mp3"] = "mp3";
  AudioCodec2["Aac"] = "aac";
  AudioCodec2["Opus"] = "opus";
  AudioCodec2["PcmS16Le"] = "pcm_s16le";
})(AudioCodec || (AudioCodec = {}));
var VideoContainer;
(function(VideoContainer2) {
  VideoContainer2["Mov"] = "mov";
  VideoContainer2["Mp4"] = "mp4";
  VideoContainer2["Ogg"] = "ogg";
  VideoContainer2["Webm"] = "webm";
})(VideoContainer || (VideoContainer = {}));
var VideoCodec;
(function(VideoCodec2) {
  VideoCodec2["H264"] = "h264";
  VideoCodec2["Hevc"] = "hevc";
  VideoCodec2["Vp9"] = "vp9";
  VideoCodec2["Av1"] = "av1";
})(VideoCodec || (VideoCodec = {}));
var CQMode;
(function(CQMode2) {
  CQMode2["Auto"] = "auto";
  CQMode2["Cqp"] = "cqp";
  CQMode2["Icq"] = "icq";
})(CQMode || (CQMode = {}));
var ToneMapping;
(function(ToneMapping2) {
  ToneMapping2["Hable"] = "hable";
  ToneMapping2["Mobius"] = "mobius";
  ToneMapping2["Reinhard"] = "reinhard";
  ToneMapping2["Disabled"] = "disabled";
})(ToneMapping || (ToneMapping = {}));
var TranscodePolicy;
(function(TranscodePolicy2) {
  TranscodePolicy2["All"] = "all";
  TranscodePolicy2["Optimal"] = "optimal";
  TranscodePolicy2["Bitrate"] = "bitrate";
  TranscodePolicy2["Required"] = "required";
  TranscodePolicy2["Disabled"] = "disabled";
})(TranscodePolicy || (TranscodePolicy = {}));
var Colorspace;
(function(Colorspace2) {
  Colorspace2["Srgb"] = "srgb";
  Colorspace2["P3"] = "p3";
})(Colorspace || (Colorspace = {}));
var ImageFormat;
(function(ImageFormat2) {
  ImageFormat2["Jpeg"] = "jpeg";
  ImageFormat2["Webp"] = "webp";
})(ImageFormat || (ImageFormat = {}));
var LogLevel;
(function(LogLevel2) {
  LogLevel2["Verbose"] = "verbose";
  LogLevel2["Debug"] = "debug";
  LogLevel2["Log"] = "log";
  LogLevel2["Warn"] = "warn";
  LogLevel2["Error"] = "error";
  LogLevel2["Fatal"] = "fatal";
})(LogLevel || (LogLevel = {}));
var OAuthTokenEndpointAuthMethod;
(function(OAuthTokenEndpointAuthMethod2) {
  OAuthTokenEndpointAuthMethod2["ClientSecretPost"] = "client_secret_post";
  OAuthTokenEndpointAuthMethod2["ClientSecretBasic"] = "client_secret_basic";
})(OAuthTokenEndpointAuthMethod || (OAuthTokenEndpointAuthMethod = {}));
var AssetOrderBy;
(function(AssetOrderBy2) {
  AssetOrderBy2["TakenAt"] = "takenAt";
  AssetOrderBy2["CreatedAt"] = "createdAt";
})(AssetOrderBy || (AssetOrderBy = {}));
var UserMetadataKey;
(function(UserMetadataKey2) {
  UserMetadataKey2["Preferences"] = "preferences";
  UserMetadataKey2["License"] = "license";
  UserMetadataKey2["Onboarding"] = "onboarding";
})(UserMetadataKey || (UserMetadataKey = {}));

// src/host-functions.ts
var hostFunctions = (authToken) => {
  const host = Host.getFunctions();
  const call = (name, authToken2, args) => {
    const pointer1 = Memory.fromString(JSON.stringify({ authToken: authToken2, args }));
    const fn = host[name];
    const handler = Memory.find(fn(pointer1.offset));
    try {
      const result = JSON.parse(handler.readString());
      if (result.success) {
        return result.response;
      }
      throw new Error(
        `Failed to call host function "${String(name)}", received ${result.status} - ${JSON.stringify(result.message)}`
      );
    } finally {
      handler.free();
      pointer1.free();
    }
  };
  return {
    // album
    searchAlbums: (dto) => call("searchAlbums", authToken, [
      dto
    ]),
    createAlbum: (dto) => call("createAlbum", authToken, [dto]),
    addAssetsToAlbum: (albumId, assetIds) => call(
      "addAssetsToAlbum",
      authToken,
      [albumId, { ids: assetIds }]
    ),
    addAssetsToAlbums: ({ assetIds, albumIds }) => call("addAssetsToAlbums", authToken, [{ albumIds, assetIds }])
  };
};

// src/sdk.ts
var wrapper = (fn) => {
  const input = Host.inputString();
  try {
    const payload = JSON.parse(input);
    const event = {
      ...payload,
      functions: hostFunctions(payload.workflow.authToken)
    };
    const eventConfigBefore = JSON.stringify(event.config);
    console.debug(
      `Inputs: trigger=${event.trigger}, event=${event.type}, config=${eventConfigBefore}`
    );
    const response = fn(event) ?? {};
    const eventConfigAfter = JSON.stringify(event.config);
    if (!response.config && eventConfigBefore !== eventConfigAfter) {
      response.config = event.config;
    }
    console.debug(
      `Outputs: workflow=${JSON.stringify(response.workflow)}, changes=${JSON.stringify(response.changes)}, data=${JSON.stringify(response.data)}, config=${JSON.stringify(response.config)}`
    );
    const output = JSON.stringify(response);
    Host.outputString(output);
  } catch (error) {
    console.error(`Unhandled plugin exception: ${error.message || error}`);
    throw error;
  }
};

// src/types.ts
var WorkflowTrigger2 = /* @__PURE__ */ ((WorkflowTrigger3) => {
  WorkflowTrigger3["AssetCreate"] = "AssetCreate";
  WorkflowTrigger3["AssetMetadataExtraction"] = "AssetMetadataExtraction";
  WorkflowTrigger3["PersonRecognized"] = "PersonRecognized";
  return WorkflowTrigger3;
})(WorkflowTrigger2 || {});
export {
  WorkflowTrigger2 as WorkflowTrigger,
  hostFunctions,
  wrapper
};
