"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  assetAddToAlbums: () => assetAddToAlbums,
  assetArchive: () => assetArchive,
  assetFavorite: () => assetFavorite,
  assetFileFilter: () => assetFileFilter,
  assetLock: () => assetLock,
  assetMissingTimeZoneFilter: () => assetMissingTimeZoneFilter,
  assetTrash: () => assetTrash,
  assetVisibility: () => assetVisibility
});
module.exports = __toCommonJS(index_exports);

// ../plugin-sdk/dist/index.js
var __defProp2 = Object.defineProperty;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField2 = (obj, key, value) => __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
var a = [encodeURIComponent, encodeURIComponent];
function d(e, t22 = ",") {
  const o22 = (n, r) => {
    const c = e[r % e.length];
    return typeof n > "u" ? "" : typeof n == "object" ? Array.isArray(n) ? n.map(c).join(t22) : Object.entries(n).reduce(
      (i, f) => [...i, ...f],
      []
    ).map(c).join(t22) : c(l(n));
  };
  return (n, ...r) => n.reduce((c, u, i) => `${c}${u}${o22(r[i], i)}`, "");
}
function R(e = ",") {
  return (t22, o22 = a) => Object.entries(t22).filter(([, n]) => n !== void 0).map(([n, r]) => d(o22, e)`${n}=${r}`).join("&");
}
function j(...e) {
  return e.filter(Boolean).map((t22, o22) => o22 === 0 ? t22 : t22.replace(/^\/+/, "")).map((t22, o22, n) => o22 === n.length - 1 ? t22 : t22.replace(/\/+$/, "")).join("/");
}
function l(e) {
  return typeof e == "string" || typeof e == "number" || typeof e == "boolean" ? e : String(e);
}
var A = R();
var O = R("|");
var g = R("%20");
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
function D(a22 = {}) {
  async function r(e, n) {
    const t22 = await p(e, n);
    let s2;
    try {
      s2 = await t22.text();
    } catch {
    }
    return {
      status: t22.status,
      headers: t22.headers,
      contentType: t22.headers.get("content-type"),
      data: s2
    };
  }
  async function i(e, n = {}) {
    const { status: t22, headers: s2, contentType: u, data: c } = await r(e, {
      ...n,
      headers: o(
        {
          Accept: "application/json"
        },
        n.headers
      )
    });
    return (u ? u.includes("json") : false) ? {
      status: t22,
      headers: s2,
      data: c ? JSON.parse(c) : null
    } : { status: t22, headers: s2, data: c };
  }
  async function f(e, n = {}) {
    const t22 = await p(e, n);
    let s2;
    try {
      s2 = await t22.blob();
    } catch {
    }
    return { status: t22.status, headers: t22.headers, data: s2 };
  }
  async function p(e, n = {}) {
    const {
      baseUrl: t22,
      fetch: s2,
      ...u
    } = {
      ...a22,
      ...n,
      headers: o(a22.headers, n.headers)
    }, c = j(t22, e);
    return await (s2 || fetch)(c, u);
  }
  return {
    ok: y,
    fetchText: r,
    fetchJson: i,
    fetchBlob: f,
    mergeHeaders: o,
    json({ body: e, headers: n, ...t22 }) {
      return {
        ...t22,
        ...e != null && { body: JSON.stringify(e) },
        headers: o(
          {
            "Content-Type": "application/json"
          },
          n
        )
      };
    },
    form({ body: e, headers: n, ...t22 }) {
      return {
        ...t22,
        ...e != null && { body: A(e) },
        headers: o(
          {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          n
        )
      };
    },
    multipart({ body: e, headers: n, ...t22 }) {
      if (e == null)
        return { ...t22, body: e, headers: t(n) };
      const s2 = new (t22.FormData || t22.formDataConstructor || a22.FormData || a22.formDataConstructor || FormData)(), u = (c, o22) => {
        typeof o22 == "string" || o22 instanceof Blob ? s2.append(c, o22) : typeof o22 == "number" || typeof o22 == "boolean" ? s2.append(c, String(o22)) : s2.append(
          c,
          new Blob([JSON.stringify(o22)], { type: "application/json" })
        );
      };
      return Object.entries(e).forEach(([c, o22]) => {
        Array.isArray(o22) ? o22.forEach((m) => u(c, m)) : u(c, o22);
      }), {
        ...t22,
        body: s2,
        headers: t(n)
      };
    }
  };
}
var j2 = [200, 201, 202, 204];
async function y(a22) {
  const r = await a22;
  if (j2.some((i) => i == r.status)) return r.data;
  throw new l2(r.status, r.data, r.headers);
}
var l2 = class extends Error {
  constructor(r, i, f) {
    super(`Error: ${r}`);
    __publicField2(this, "status");
    __publicField2(this, "data");
    __publicField2(this, "headers");
    this.status = r, this.data = i, this.headers = f;
  }
};
var defaults = {
  headers: {},
  baseUrl: "/api"
};
var oazapfts = D(defaults);
var ReactionLevel;
(function(ReactionLevel22) {
  ReactionLevel22["Album"] = "album";
  ReactionLevel22["Asset"] = "asset";
})(ReactionLevel || (ReactionLevel = {}));
var ReactionType;
(function(ReactionType22) {
  ReactionType22["Comment"] = "comment";
  ReactionType22["Like"] = "like";
})(ReactionType || (ReactionType = {}));
var UserAvatarColor;
(function(UserAvatarColor22) {
  UserAvatarColor22["Primary"] = "primary";
  UserAvatarColor22["Pink"] = "pink";
  UserAvatarColor22["Red"] = "red";
  UserAvatarColor22["Yellow"] = "yellow";
  UserAvatarColor22["Blue"] = "blue";
  UserAvatarColor22["Green"] = "green";
  UserAvatarColor22["Purple"] = "purple";
  UserAvatarColor22["Orange"] = "orange";
  UserAvatarColor22["Gray"] = "gray";
  UserAvatarColor22["Amber"] = "amber";
})(UserAvatarColor || (UserAvatarColor = {}));
var MaintenanceAction;
(function(MaintenanceAction22) {
  MaintenanceAction22["Start"] = "start";
  MaintenanceAction22["End"] = "end";
  MaintenanceAction22["SelectDatabaseRestore"] = "select_database_restore";
  MaintenanceAction22["RestoreDatabase"] = "restore_database";
})(MaintenanceAction || (MaintenanceAction = {}));
var StorageFolder;
(function(StorageFolder22) {
  StorageFolder22["EncodedVideo"] = "encoded-video";
  StorageFolder22["Library"] = "library";
  StorageFolder22["Upload"] = "upload";
  StorageFolder22["Profile"] = "profile";
  StorageFolder22["Thumbs"] = "thumbs";
  StorageFolder22["Backups"] = "backups";
})(StorageFolder || (StorageFolder = {}));
var NotificationLevel;
(function(NotificationLevel22) {
  NotificationLevel22["Success"] = "success";
  NotificationLevel22["Error"] = "error";
  NotificationLevel22["Warning"] = "warning";
  NotificationLevel22["Info"] = "info";
})(NotificationLevel || (NotificationLevel = {}));
var NotificationType;
(function(NotificationType22) {
  NotificationType22["JobFailed"] = "JobFailed";
  NotificationType22["BackupFailed"] = "BackupFailed";
  NotificationType22["SystemMessage"] = "SystemMessage";
  NotificationType22["AlbumInvite"] = "AlbumInvite";
  NotificationType22["AlbumUpdate"] = "AlbumUpdate";
  NotificationType22["Custom"] = "Custom";
})(NotificationType || (NotificationType = {}));
var UserStatus;
(function(UserStatus22) {
  UserStatus22["Active"] = "active";
  UserStatus22["Removing"] = "removing";
  UserStatus22["Deleted"] = "deleted";
})(UserStatus || (UserStatus = {}));
var AssetOrder;
(function(AssetOrder22) {
  AssetOrder22["Asc"] = "asc";
  AssetOrder22["Desc"] = "desc";
})(AssetOrder || (AssetOrder = {}));
var AssetVisibility;
(function(AssetVisibility22) {
  AssetVisibility22["Archive"] = "archive";
  AssetVisibility22["Timeline"] = "timeline";
  AssetVisibility22["Hidden"] = "hidden";
  AssetVisibility22["Locked"] = "locked";
})(AssetVisibility || (AssetVisibility = {}));
var AlbumUserRole;
(function(AlbumUserRole22) {
  AlbumUserRole22["Editor"] = "editor";
  AlbumUserRole22["Owner"] = "owner";
  AlbumUserRole22["Viewer"] = "viewer";
})(AlbumUserRole || (AlbumUserRole = {}));
var BulkIdErrorReason;
(function(BulkIdErrorReason22) {
  BulkIdErrorReason22["Duplicate"] = "duplicate";
  BulkIdErrorReason22["NoPermission"] = "no_permission";
  BulkIdErrorReason22["NotFound"] = "not_found";
  BulkIdErrorReason22["Unknown"] = "unknown";
  BulkIdErrorReason22["Validation"] = "validation";
})(BulkIdErrorReason || (BulkIdErrorReason = {}));
var Permission;
(function(Permission22) {
  Permission22["All"] = "all";
  Permission22["ActivityCreate"] = "activity.create";
  Permission22["ActivityRead"] = "activity.read";
  Permission22["ActivityUpdate"] = "activity.update";
  Permission22["ActivityDelete"] = "activity.delete";
  Permission22["ActivityStatistics"] = "activity.statistics";
  Permission22["ApiKeyCreate"] = "apiKey.create";
  Permission22["ApiKeyRead"] = "apiKey.read";
  Permission22["ApiKeyUpdate"] = "apiKey.update";
  Permission22["ApiKeyDelete"] = "apiKey.delete";
  Permission22["AssetRead"] = "asset.read";
  Permission22["AssetUpdate"] = "asset.update";
  Permission22["AssetDelete"] = "asset.delete";
  Permission22["AssetStatistics"] = "asset.statistics";
  Permission22["AssetShare"] = "asset.share";
  Permission22["AssetView"] = "asset.view";
  Permission22["AssetDownload"] = "asset.download";
  Permission22["AssetUpload"] = "asset.upload";
  Permission22["AssetCopy"] = "asset.copy";
  Permission22["AssetDerive"] = "asset.derive";
  Permission22["AssetEditGet"] = "asset.edit.get";
  Permission22["AssetEditCreate"] = "asset.edit.create";
  Permission22["AssetEditDelete"] = "asset.edit.delete";
  Permission22["AlbumCreate"] = "album.create";
  Permission22["AlbumRead"] = "album.read";
  Permission22["AlbumUpdate"] = "album.update";
  Permission22["AlbumDelete"] = "album.delete";
  Permission22["AlbumStatistics"] = "album.statistics";
  Permission22["AlbumShare"] = "album.share";
  Permission22["AlbumDownload"] = "album.download";
  Permission22["AlbumAssetCreate"] = "albumAsset.create";
  Permission22["AlbumAssetDelete"] = "albumAsset.delete";
  Permission22["AlbumUserCreate"] = "albumUser.create";
  Permission22["AlbumUserUpdate"] = "albumUser.update";
  Permission22["AlbumUserDelete"] = "albumUser.delete";
  Permission22["AuthChangePassword"] = "auth.changePassword";
  Permission22["AuthDeviceDelete"] = "authDevice.delete";
  Permission22["ArchiveRead"] = "archive.read";
  Permission22["BackupList"] = "backup.list";
  Permission22["BackupDownload"] = "backup.download";
  Permission22["BackupUpload"] = "backup.upload";
  Permission22["BackupDelete"] = "backup.delete";
  Permission22["DuplicateRead"] = "duplicate.read";
  Permission22["DuplicateDelete"] = "duplicate.delete";
  Permission22["FaceCreate"] = "face.create";
  Permission22["FaceRead"] = "face.read";
  Permission22["FaceUpdate"] = "face.update";
  Permission22["FaceDelete"] = "face.delete";
  Permission22["FolderRead"] = "folder.read";
  Permission22["JobCreate"] = "job.create";
  Permission22["JobRead"] = "job.read";
  Permission22["LibraryCreate"] = "library.create";
  Permission22["LibraryRead"] = "library.read";
  Permission22["LibraryUpdate"] = "library.update";
  Permission22["LibraryDelete"] = "library.delete";
  Permission22["LibraryStatistics"] = "library.statistics";
  Permission22["TimelineRead"] = "timeline.read";
  Permission22["TimelineDownload"] = "timeline.download";
  Permission22["Maintenance"] = "maintenance";
  Permission22["MapRead"] = "map.read";
  Permission22["MapSearch"] = "map.search";
  Permission22["MemoryCreate"] = "memory.create";
  Permission22["MemoryRead"] = "memory.read";
  Permission22["MemoryUpdate"] = "memory.update";
  Permission22["MemoryDelete"] = "memory.delete";
  Permission22["MemoryStatistics"] = "memory.statistics";
  Permission22["MemoryAssetCreate"] = "memoryAsset.create";
  Permission22["MemoryAssetDelete"] = "memoryAsset.delete";
  Permission22["NotificationCreate"] = "notification.create";
  Permission22["NotificationRead"] = "notification.read";
  Permission22["NotificationUpdate"] = "notification.update";
  Permission22["NotificationDelete"] = "notification.delete";
  Permission22["PartnerCreate"] = "partner.create";
  Permission22["PartnerRead"] = "partner.read";
  Permission22["PartnerUpdate"] = "partner.update";
  Permission22["PartnerDelete"] = "partner.delete";
  Permission22["PersonCreate"] = "person.create";
  Permission22["PersonRead"] = "person.read";
  Permission22["PersonUpdate"] = "person.update";
  Permission22["PersonDelete"] = "person.delete";
  Permission22["PersonStatistics"] = "person.statistics";
  Permission22["PersonMerge"] = "person.merge";
  Permission22["PersonReassign"] = "person.reassign";
  Permission22["PinCodeCreate"] = "pinCode.create";
  Permission22["PinCodeUpdate"] = "pinCode.update";
  Permission22["PinCodeDelete"] = "pinCode.delete";
  Permission22["PluginCreate"] = "plugin.create";
  Permission22["PluginRead"] = "plugin.read";
  Permission22["PluginUpdate"] = "plugin.update";
  Permission22["PluginDelete"] = "plugin.delete";
  Permission22["ServerAbout"] = "server.about";
  Permission22["ServerApkLinks"] = "server.apkLinks";
  Permission22["ServerStorage"] = "server.storage";
  Permission22["ServerStatistics"] = "server.statistics";
  Permission22["ServerVersionCheck"] = "server.versionCheck";
  Permission22["ServerLicenseRead"] = "serverLicense.read";
  Permission22["ServerLicenseUpdate"] = "serverLicense.update";
  Permission22["ServerLicenseDelete"] = "serverLicense.delete";
  Permission22["SessionCreate"] = "session.create";
  Permission22["SessionRead"] = "session.read";
  Permission22["SessionUpdate"] = "session.update";
  Permission22["SessionDelete"] = "session.delete";
  Permission22["SessionLock"] = "session.lock";
  Permission22["SharedLinkCreate"] = "sharedLink.create";
  Permission22["SharedLinkRead"] = "sharedLink.read";
  Permission22["SharedLinkUpdate"] = "sharedLink.update";
  Permission22["SharedLinkDelete"] = "sharedLink.delete";
  Permission22["StackCreate"] = "stack.create";
  Permission22["StackRead"] = "stack.read";
  Permission22["StackUpdate"] = "stack.update";
  Permission22["StackDelete"] = "stack.delete";
  Permission22["SyncStream"] = "sync.stream";
  Permission22["SyncCheckpointRead"] = "syncCheckpoint.read";
  Permission22["SyncCheckpointUpdate"] = "syncCheckpoint.update";
  Permission22["SyncCheckpointDelete"] = "syncCheckpoint.delete";
  Permission22["SystemConfigRead"] = "systemConfig.read";
  Permission22["SystemConfigUpdate"] = "systemConfig.update";
  Permission22["SystemMetadataRead"] = "systemMetadata.read";
  Permission22["SystemMetadataUpdate"] = "systemMetadata.update";
  Permission22["TagCreate"] = "tag.create";
  Permission22["TagRead"] = "tag.read";
  Permission22["TagUpdate"] = "tag.update";
  Permission22["TagDelete"] = "tag.delete";
  Permission22["TagAsset"] = "tag.asset";
  Permission22["UserRead"] = "user.read";
  Permission22["UserUpdate"] = "user.update";
  Permission22["UserLicenseCreate"] = "userLicense.create";
  Permission22["UserLicenseRead"] = "userLicense.read";
  Permission22["UserLicenseUpdate"] = "userLicense.update";
  Permission22["UserLicenseDelete"] = "userLicense.delete";
  Permission22["UserOnboardingRead"] = "userOnboarding.read";
  Permission22["UserOnboardingUpdate"] = "userOnboarding.update";
  Permission22["UserOnboardingDelete"] = "userOnboarding.delete";
  Permission22["UserPreferenceRead"] = "userPreference.read";
  Permission22["UserPreferenceUpdate"] = "userPreference.update";
  Permission22["UserProfileImageCreate"] = "userProfileImage.create";
  Permission22["UserProfileImageRead"] = "userProfileImage.read";
  Permission22["UserProfileImageUpdate"] = "userProfileImage.update";
  Permission22["UserProfileImageDelete"] = "userProfileImage.delete";
  Permission22["QueueRead"] = "queue.read";
  Permission22["QueueUpdate"] = "queue.update";
  Permission22["QueueJobCreate"] = "queueJob.create";
  Permission22["QueueJobRead"] = "queueJob.read";
  Permission22["QueueJobUpdate"] = "queueJob.update";
  Permission22["QueueJobDelete"] = "queueJob.delete";
  Permission22["WorkflowCreate"] = "workflow.create";
  Permission22["WorkflowRead"] = "workflow.read";
  Permission22["WorkflowUpdate"] = "workflow.update";
  Permission22["WorkflowDelete"] = "workflow.delete";
  Permission22["AdminUserCreate"] = "adminUser.create";
  Permission22["AdminUserRead"] = "adminUser.read";
  Permission22["AdminUserUpdate"] = "adminUser.update";
  Permission22["AdminUserDelete"] = "adminUser.delete";
  Permission22["AdminSessionRead"] = "adminSession.read";
  Permission22["AdminAuthUnlinkAll"] = "adminAuth.unlinkAll";
})(Permission || (Permission = {}));
var AssetMediaStatus;
(function(AssetMediaStatus22) {
  AssetMediaStatus22["Created"] = "created";
  AssetMediaStatus22["Duplicate"] = "duplicate";
})(AssetMediaStatus || (AssetMediaStatus = {}));
var AssetUploadAction;
(function(AssetUploadAction22) {
  AssetUploadAction22["Accept"] = "accept";
  AssetUploadAction22["Reject"] = "reject";
})(AssetUploadAction || (AssetUploadAction = {}));
var AssetRejectReason;
(function(AssetRejectReason22) {
  AssetRejectReason22["Duplicate"] = "duplicate";
  AssetRejectReason22["UnsupportedFormat"] = "unsupported-format";
})(AssetRejectReason || (AssetRejectReason = {}));
var AssetJobName;
(function(AssetJobName22) {
  AssetJobName22["RefreshFaces"] = "refresh-faces";
  AssetJobName22["RefreshMetadata"] = "refresh-metadata";
  AssetJobName22["RegenerateThumbnail"] = "regenerate-thumbnail";
  AssetJobName22["TranscodeVideo"] = "transcode-video";
})(AssetJobName || (AssetJobName = {}));
var AssetTypeEnum;
(function(AssetTypeEnum22) {
  AssetTypeEnum22["Image"] = "IMAGE";
  AssetTypeEnum22["Video"] = "VIDEO";
  AssetTypeEnum22["Audio"] = "AUDIO";
  AssetTypeEnum22["Other"] = "OTHER";
})(AssetTypeEnum || (AssetTypeEnum = {}));
var AssetEditAction;
(function(AssetEditAction22) {
  AssetEditAction22["Crop"] = "crop";
  AssetEditAction22["Rotate"] = "rotate";
  AssetEditAction22["Mirror"] = "mirror";
})(AssetEditAction || (AssetEditAction = {}));
var MirrorAxis;
(function(MirrorAxis22) {
  MirrorAxis22["Horizontal"] = "horizontal";
  MirrorAxis22["Vertical"] = "vertical";
})(MirrorAxis || (MirrorAxis = {}));
var AssetMediaSize;
(function(AssetMediaSize22) {
  AssetMediaSize22["Original"] = "original";
  AssetMediaSize22["Fullsize"] = "fullsize";
  AssetMediaSize22["Preview"] = "preview";
  AssetMediaSize22["Thumbnail"] = "thumbnail";
})(AssetMediaSize || (AssetMediaSize = {}));
var SourceType;
(function(SourceType22) {
  SourceType22["MachineLearning"] = "machine-learning";
  SourceType22["Exif"] = "exif";
  SourceType22["Manual"] = "manual";
})(SourceType || (SourceType = {}));
var ManualJobName;
(function(ManualJobName22) {
  ManualJobName22["PersonCleanup"] = "person-cleanup";
  ManualJobName22["TagCleanup"] = "tag-cleanup";
  ManualJobName22["UserCleanup"] = "user-cleanup";
  ManualJobName22["MemoryCleanup"] = "memory-cleanup";
  ManualJobName22["MemoryCreate"] = "memory-create";
  ManualJobName22["BackupDatabase"] = "backup-database";
})(ManualJobName || (ManualJobName = {}));
var QueueName;
(function(QueueName22) {
  QueueName22["ThumbnailGeneration"] = "thumbnailGeneration";
  QueueName22["MetadataExtraction"] = "metadataExtraction";
  QueueName22["VideoConversion"] = "videoConversion";
  QueueName22["FaceDetection"] = "faceDetection";
  QueueName22["FacialRecognition"] = "facialRecognition";
  QueueName22["SmartSearch"] = "smartSearch";
  QueueName22["DuplicateDetection"] = "duplicateDetection";
  QueueName22["BackgroundTask"] = "backgroundTask";
  QueueName22["StorageTemplateMigration"] = "storageTemplateMigration";
  QueueName22["Migration"] = "migration";
  QueueName22["Search"] = "search";
  QueueName22["Sidecar"] = "sidecar";
  QueueName22["Library"] = "library";
  QueueName22["Notifications"] = "notifications";
  QueueName22["BackupDatabase"] = "backupDatabase";
  QueueName22["Ocr"] = "ocr";
  QueueName22["Workflow"] = "workflow";
  QueueName22["Editor"] = "editor";
})(QueueName || (QueueName = {}));
var QueueCommand;
(function(QueueCommand22) {
  QueueCommand22["Start"] = "start";
  QueueCommand22["Pause"] = "pause";
  QueueCommand22["Resume"] = "resume";
  QueueCommand22["Empty"] = "empty";
  QueueCommand22["ClearFailed"] = "clear-failed";
})(QueueCommand || (QueueCommand = {}));
var MemorySearchOrder;
(function(MemorySearchOrder22) {
  MemorySearchOrder22["Asc"] = "asc";
  MemorySearchOrder22["Desc"] = "desc";
  MemorySearchOrder22["Random"] = "random";
})(MemorySearchOrder || (MemorySearchOrder = {}));
var MemoryType;
(function(MemoryType22) {
  MemoryType22["OnThisDay"] = "on_this_day";
})(MemoryType || (MemoryType = {}));
var PartnerDirection;
(function(PartnerDirection22) {
  PartnerDirection22["SharedBy"] = "shared-by";
  PartnerDirection22["SharedWith"] = "shared-with";
})(PartnerDirection || (PartnerDirection = {}));
var WorkflowType;
(function(WorkflowType22) {
  WorkflowType22["AssetV1"] = "AssetV1";
  WorkflowType22["AssetPersonV1"] = "AssetPersonV1";
})(WorkflowType || (WorkflowType = {}));
var WorkflowTrigger;
(function(WorkflowTrigger3) {
  WorkflowTrigger3["AssetCreate"] = "AssetCreate";
  WorkflowTrigger3["AssetMetadataExtraction"] = "AssetMetadataExtraction";
  WorkflowTrigger3["PersonRecognized"] = "PersonRecognized";
})(WorkflowTrigger || (WorkflowTrigger = {}));
var QueueJobStatus;
(function(QueueJobStatus22) {
  QueueJobStatus22["Active"] = "active";
  QueueJobStatus22["Failed"] = "failed";
  QueueJobStatus22["Completed"] = "completed";
  QueueJobStatus22["Delayed"] = "delayed";
  QueueJobStatus22["Waiting"] = "waiting";
  QueueJobStatus22["Paused"] = "paused";
})(QueueJobStatus || (QueueJobStatus = {}));
var JobName;
(function(JobName22) {
  JobName22["AssetDelete"] = "AssetDelete";
  JobName22["AssetDeleteCheck"] = "AssetDeleteCheck";
  JobName22["AssetDetectFacesQueueAll"] = "AssetDetectFacesQueueAll";
  JobName22["AssetDetectFaces"] = "AssetDetectFaces";
  JobName22["AssetDetectDuplicatesQueueAll"] = "AssetDetectDuplicatesQueueAll";
  JobName22["AssetDetectDuplicates"] = "AssetDetectDuplicates";
  JobName22["AssetEditThumbnailGeneration"] = "AssetEditThumbnailGeneration";
  JobName22["AssetEncodeVideoQueueAll"] = "AssetEncodeVideoQueueAll";
  JobName22["AssetEncodeVideo"] = "AssetEncodeVideo";
  JobName22["AssetEmptyTrash"] = "AssetEmptyTrash";
  JobName22["AssetExtractMetadataQueueAll"] = "AssetExtractMetadataQueueAll";
  JobName22["AssetExtractMetadata"] = "AssetExtractMetadata";
  JobName22["AssetFileMigration"] = "AssetFileMigration";
  JobName22["AssetGenerateThumbnailsQueueAll"] = "AssetGenerateThumbnailsQueueAll";
  JobName22["AssetGenerateThumbnails"] = "AssetGenerateThumbnails";
  JobName22["AuditTableCleanup"] = "AuditTableCleanup";
  JobName22["DatabaseBackup"] = "DatabaseBackup";
  JobName22["FacialRecognitionQueueAll"] = "FacialRecognitionQueueAll";
  JobName22["FacialRecognition"] = "FacialRecognition";
  JobName22["FileDelete"] = "FileDelete";
  JobName22["FileMigrationQueueAll"] = "FileMigrationQueueAll";
  JobName22["LibraryDeleteCheck"] = "LibraryDeleteCheck";
  JobName22["LibraryDelete"] = "LibraryDelete";
  JobName22["LibraryRemoveAsset"] = "LibraryRemoveAsset";
  JobName22["LibraryScanAssetsQueueAll"] = "LibraryScanAssetsQueueAll";
  JobName22["LibrarySyncAssets"] = "LibrarySyncAssets";
  JobName22["LibrarySyncFilesQueueAll"] = "LibrarySyncFilesQueueAll";
  JobName22["LibrarySyncFiles"] = "LibrarySyncFiles";
  JobName22["LibraryScanQueueAll"] = "LibraryScanQueueAll";
  JobName22["MemoryCleanup"] = "MemoryCleanup";
  JobName22["MemoryGenerate"] = "MemoryGenerate";
  JobName22["NotificationsCleanup"] = "NotificationsCleanup";
  JobName22["NotifyUserSignup"] = "NotifyUserSignup";
  JobName22["NotifyAlbumInvite"] = "NotifyAlbumInvite";
  JobName22["NotifyAlbumUpdate"] = "NotifyAlbumUpdate";
  JobName22["UserDelete"] = "UserDelete";
  JobName22["UserDeleteCheck"] = "UserDeleteCheck";
  JobName22["UserSyncUsage"] = "UserSyncUsage";
  JobName22["PersonCleanup"] = "PersonCleanup";
  JobName22["PersonFileMigration"] = "PersonFileMigration";
  JobName22["PersonGenerateThumbnail"] = "PersonGenerateThumbnail";
  JobName22["SessionCleanup"] = "SessionCleanup";
  JobName22["SendMail"] = "SendMail";
  JobName22["SidecarQueueAll"] = "SidecarQueueAll";
  JobName22["SidecarCheck"] = "SidecarCheck";
  JobName22["SidecarWrite"] = "SidecarWrite";
  JobName22["SmartSearchQueueAll"] = "SmartSearchQueueAll";
  JobName22["SmartSearch"] = "SmartSearch";
  JobName22["StorageTemplateMigration"] = "StorageTemplateMigration";
  JobName22["StorageTemplateMigrationSingle"] = "StorageTemplateMigrationSingle";
  JobName22["TagCleanup"] = "TagCleanup";
  JobName22["VersionCheck"] = "VersionCheck";
  JobName22["OcrQueueAll"] = "OcrQueueAll";
  JobName22["Ocr"] = "Ocr";
  JobName22["WorkflowAssetTrigger"] = "WorkflowAssetTrigger";
})(JobName || (JobName = {}));
var SearchSuggestionType;
(function(SearchSuggestionType22) {
  SearchSuggestionType22["Country"] = "country";
  SearchSuggestionType22["State"] = "state";
  SearchSuggestionType22["City"] = "city";
  SearchSuggestionType22["CameraMake"] = "camera-make";
  SearchSuggestionType22["CameraModel"] = "camera-model";
  SearchSuggestionType22["CameraLensModel"] = "camera-lens-model";
})(SearchSuggestionType || (SearchSuggestionType = {}));
var SharedLinkType;
(function(SharedLinkType22) {
  SharedLinkType22["Album"] = "ALBUM";
  SharedLinkType22["Individual"] = "INDIVIDUAL";
})(SharedLinkType || (SharedLinkType = {}));
var AssetIdErrorReason;
(function(AssetIdErrorReason22) {
  AssetIdErrorReason22["Duplicate"] = "duplicate";
  AssetIdErrorReason22["NoPermission"] = "no_permission";
  AssetIdErrorReason22["NotFound"] = "not_found";
})(AssetIdErrorReason || (AssetIdErrorReason = {}));
var SyncEntityType;
(function(SyncEntityType22) {
  SyncEntityType22["AuthUserV1"] = "AuthUserV1";
  SyncEntityType22["UserV1"] = "UserV1";
  SyncEntityType22["UserDeleteV1"] = "UserDeleteV1";
  SyncEntityType22["AssetV1"] = "AssetV1";
  SyncEntityType22["AssetV2"] = "AssetV2";
  SyncEntityType22["AssetDeleteV1"] = "AssetDeleteV1";
  SyncEntityType22["AssetExifV1"] = "AssetExifV1";
  SyncEntityType22["AssetEditV1"] = "AssetEditV1";
  SyncEntityType22["AssetEditDeleteV1"] = "AssetEditDeleteV1";
  SyncEntityType22["AssetMetadataV1"] = "AssetMetadataV1";
  SyncEntityType22["AssetMetadataDeleteV1"] = "AssetMetadataDeleteV1";
  SyncEntityType22["PartnerV1"] = "PartnerV1";
  SyncEntityType22["PartnerDeleteV1"] = "PartnerDeleteV1";
  SyncEntityType22["PartnerAssetV1"] = "PartnerAssetV1";
  SyncEntityType22["PartnerAssetV2"] = "PartnerAssetV2";
  SyncEntityType22["PartnerAssetBackfillV1"] = "PartnerAssetBackfillV1";
  SyncEntityType22["PartnerAssetBackfillV2"] = "PartnerAssetBackfillV2";
  SyncEntityType22["PartnerAssetDeleteV1"] = "PartnerAssetDeleteV1";
  SyncEntityType22["PartnerAssetExifV1"] = "PartnerAssetExifV1";
  SyncEntityType22["PartnerAssetExifBackfillV1"] = "PartnerAssetExifBackfillV1";
  SyncEntityType22["PartnerStackBackfillV1"] = "PartnerStackBackfillV1";
  SyncEntityType22["PartnerStackDeleteV1"] = "PartnerStackDeleteV1";
  SyncEntityType22["PartnerStackV1"] = "PartnerStackV1";
  SyncEntityType22["AlbumV1"] = "AlbumV1";
  SyncEntityType22["AlbumV2"] = "AlbumV2";
  SyncEntityType22["AlbumDeleteV1"] = "AlbumDeleteV1";
  SyncEntityType22["AlbumUserV1"] = "AlbumUserV1";
  SyncEntityType22["AlbumUserBackfillV1"] = "AlbumUserBackfillV1";
  SyncEntityType22["AlbumUserDeleteV1"] = "AlbumUserDeleteV1";
  SyncEntityType22["AlbumAssetCreateV1"] = "AlbumAssetCreateV1";
  SyncEntityType22["AlbumAssetCreateV2"] = "AlbumAssetCreateV2";
  SyncEntityType22["AlbumAssetUpdateV1"] = "AlbumAssetUpdateV1";
  SyncEntityType22["AlbumAssetUpdateV2"] = "AlbumAssetUpdateV2";
  SyncEntityType22["AlbumAssetBackfillV1"] = "AlbumAssetBackfillV1";
  SyncEntityType22["AlbumAssetBackfillV2"] = "AlbumAssetBackfillV2";
  SyncEntityType22["AlbumAssetExifCreateV1"] = "AlbumAssetExifCreateV1";
  SyncEntityType22["AlbumAssetExifUpdateV1"] = "AlbumAssetExifUpdateV1";
  SyncEntityType22["AlbumAssetExifBackfillV1"] = "AlbumAssetExifBackfillV1";
  SyncEntityType22["AlbumToAssetV1"] = "AlbumToAssetV1";
  SyncEntityType22["AlbumToAssetDeleteV1"] = "AlbumToAssetDeleteV1";
  SyncEntityType22["AlbumToAssetBackfillV1"] = "AlbumToAssetBackfillV1";
  SyncEntityType22["MemoryV1"] = "MemoryV1";
  SyncEntityType22["MemoryDeleteV1"] = "MemoryDeleteV1";
  SyncEntityType22["MemoryToAssetV1"] = "MemoryToAssetV1";
  SyncEntityType22["MemoryToAssetDeleteV1"] = "MemoryToAssetDeleteV1";
  SyncEntityType22["StackV1"] = "StackV1";
  SyncEntityType22["StackDeleteV1"] = "StackDeleteV1";
  SyncEntityType22["PersonV1"] = "PersonV1";
  SyncEntityType22["PersonDeleteV1"] = "PersonDeleteV1";
  SyncEntityType22["AssetFaceV1"] = "AssetFaceV1";
  SyncEntityType22["AssetFaceV2"] = "AssetFaceV2";
  SyncEntityType22["AssetFaceDeleteV1"] = "AssetFaceDeleteV1";
  SyncEntityType22["UserMetadataV1"] = "UserMetadataV1";
  SyncEntityType22["UserMetadataDeleteV1"] = "UserMetadataDeleteV1";
  SyncEntityType22["SyncAckV1"] = "SyncAckV1";
  SyncEntityType22["SyncResetV1"] = "SyncResetV1";
  SyncEntityType22["SyncCompleteV1"] = "SyncCompleteV1";
})(SyncEntityType || (SyncEntityType = {}));
var SyncRequestType;
(function(SyncRequestType22) {
  SyncRequestType22["AlbumsV1"] = "AlbumsV1";
  SyncRequestType22["AlbumsV2"] = "AlbumsV2";
  SyncRequestType22["AlbumUsersV1"] = "AlbumUsersV1";
  SyncRequestType22["AlbumToAssetsV1"] = "AlbumToAssetsV1";
  SyncRequestType22["AlbumAssetsV1"] = "AlbumAssetsV1";
  SyncRequestType22["AlbumAssetsV2"] = "AlbumAssetsV2";
  SyncRequestType22["AlbumAssetExifsV1"] = "AlbumAssetExifsV1";
  SyncRequestType22["AssetsV1"] = "AssetsV1";
  SyncRequestType22["AssetsV2"] = "AssetsV2";
  SyncRequestType22["AssetExifsV1"] = "AssetExifsV1";
  SyncRequestType22["AssetEditsV1"] = "AssetEditsV1";
  SyncRequestType22["AssetMetadataV1"] = "AssetMetadataV1";
  SyncRequestType22["AuthUsersV1"] = "AuthUsersV1";
  SyncRequestType22["MemoriesV1"] = "MemoriesV1";
  SyncRequestType22["MemoryToAssetsV1"] = "MemoryToAssetsV1";
  SyncRequestType22["PartnersV1"] = "PartnersV1";
  SyncRequestType22["PartnerAssetsV1"] = "PartnerAssetsV1";
  SyncRequestType22["PartnerAssetsV2"] = "PartnerAssetsV2";
  SyncRequestType22["PartnerAssetExifsV1"] = "PartnerAssetExifsV1";
  SyncRequestType22["PartnerStacksV1"] = "PartnerStacksV1";
  SyncRequestType22["StacksV1"] = "StacksV1";
  SyncRequestType22["UsersV1"] = "UsersV1";
  SyncRequestType22["PeopleV1"] = "PeopleV1";
  SyncRequestType22["AssetFacesV1"] = "AssetFacesV1";
  SyncRequestType22["AssetFacesV2"] = "AssetFacesV2";
  SyncRequestType22["UserMetadataV1"] = "UserMetadataV1";
})(SyncRequestType || (SyncRequestType = {}));
var TranscodeHWAccel;
(function(TranscodeHWAccel22) {
  TranscodeHWAccel22["Nvenc"] = "nvenc";
  TranscodeHWAccel22["Qsv"] = "qsv";
  TranscodeHWAccel22["Vaapi"] = "vaapi";
  TranscodeHWAccel22["Rkmpp"] = "rkmpp";
  TranscodeHWAccel22["Disabled"] = "disabled";
})(TranscodeHWAccel || (TranscodeHWAccel = {}));
var AudioCodec;
(function(AudioCodec22) {
  AudioCodec22["Mp3"] = "mp3";
  AudioCodec22["Aac"] = "aac";
  AudioCodec22["Opus"] = "opus";
  AudioCodec22["PcmS16Le"] = "pcm_s16le";
})(AudioCodec || (AudioCodec = {}));
var VideoContainer;
(function(VideoContainer22) {
  VideoContainer22["Mov"] = "mov";
  VideoContainer22["Mp4"] = "mp4";
  VideoContainer22["Ogg"] = "ogg";
  VideoContainer22["Webm"] = "webm";
})(VideoContainer || (VideoContainer = {}));
var VideoCodec;
(function(VideoCodec22) {
  VideoCodec22["H264"] = "h264";
  VideoCodec22["Hevc"] = "hevc";
  VideoCodec22["Vp9"] = "vp9";
  VideoCodec22["Av1"] = "av1";
})(VideoCodec || (VideoCodec = {}));
var CQMode;
(function(CQMode22) {
  CQMode22["Auto"] = "auto";
  CQMode22["Cqp"] = "cqp";
  CQMode22["Icq"] = "icq";
})(CQMode || (CQMode = {}));
var ToneMapping;
(function(ToneMapping22) {
  ToneMapping22["Hable"] = "hable";
  ToneMapping22["Mobius"] = "mobius";
  ToneMapping22["Reinhard"] = "reinhard";
  ToneMapping22["Disabled"] = "disabled";
})(ToneMapping || (ToneMapping = {}));
var TranscodePolicy;
(function(TranscodePolicy22) {
  TranscodePolicy22["All"] = "all";
  TranscodePolicy22["Optimal"] = "optimal";
  TranscodePolicy22["Bitrate"] = "bitrate";
  TranscodePolicy22["Required"] = "required";
  TranscodePolicy22["Disabled"] = "disabled";
})(TranscodePolicy || (TranscodePolicy = {}));
var Colorspace;
(function(Colorspace22) {
  Colorspace22["Srgb"] = "srgb";
  Colorspace22["P3"] = "p3";
})(Colorspace || (Colorspace = {}));
var ImageFormat;
(function(ImageFormat22) {
  ImageFormat22["Jpeg"] = "jpeg";
  ImageFormat22["Webp"] = "webp";
})(ImageFormat || (ImageFormat = {}));
var LogLevel;
(function(LogLevel22) {
  LogLevel22["Verbose"] = "verbose";
  LogLevel22["Debug"] = "debug";
  LogLevel22["Log"] = "log";
  LogLevel22["Warn"] = "warn";
  LogLevel22["Error"] = "error";
  LogLevel22["Fatal"] = "fatal";
})(LogLevel || (LogLevel = {}));
var OAuthTokenEndpointAuthMethod;
(function(OAuthTokenEndpointAuthMethod22) {
  OAuthTokenEndpointAuthMethod22["ClientSecretPost"] = "client_secret_post";
  OAuthTokenEndpointAuthMethod22["ClientSecretBasic"] = "client_secret_basic";
})(OAuthTokenEndpointAuthMethod || (OAuthTokenEndpointAuthMethod = {}));
var AssetOrderBy;
(function(AssetOrderBy22) {
  AssetOrderBy22["TakenAt"] = "takenAt";
  AssetOrderBy22["CreatedAt"] = "createdAt";
})(AssetOrderBy || (AssetOrderBy = {}));
var UserMetadataKey;
(function(UserMetadataKey22) {
  UserMetadataKey22["Preferences"] = "preferences";
  UserMetadataKey22["License"] = "license";
  UserMetadataKey22["Onboarding"] = "onboarding";
})(UserMetadataKey || (UserMetadataKey = {}));
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

// ../../node_modules/.pnpm/@oazapfts+runtime@1.2.0/node_modules/@oazapfts/runtime/util.js
var a2 = [encodeURIComponent, encodeURIComponent];
function d2(e, t3 = ",") {
  const o3 = (n, r) => {
    const c = e[r % e.length];
    return typeof n > "u" ? "" : typeof n == "object" ? Array.isArray(n) ? n.map(c).join(t3) : Object.entries(n).reduce(
      (i, f) => [...i, ...f],
      []
    ).map(c).join(t3) : c(l3(n));
  };
  return (n, ...r) => n.reduce((c, u, i) => `${c}${u}${o3(r[i], i)}`, "");
}
function R2(e = ",") {
  return (t3, o3 = a2) => Object.entries(t3).filter(([, n]) => n !== void 0).map(([n, r]) => d2(o3, e)`${n}=${r}`).join("&");
}
function j3(...e) {
  return e.filter(Boolean).map((t3, o3) => o3 === 0 ? t3 : t3.replace(/^\/+/, "")).map((t3, o3, n) => o3 === n.length - 1 ? t3 : t3.replace(/\/+$/, "")).join("/");
}
function l3(e) {
  return typeof e == "string" || typeof e == "number" || typeof e == "boolean" ? e : String(e);
}

// ../../node_modules/.pnpm/@oazapfts+runtime@1.2.0/node_modules/@oazapfts/runtime/query.js
var A2 = R2();
var O2 = R2("|");
var g2 = R2("%20");

// ../../node_modules/.pnpm/@oazapfts+runtime@1.2.0/node_modules/@oazapfts/runtime/headers.js
function o2(e, r) {
  const n = t2(e);
  return t2(r).forEach((i, s2) => {
    n.set(s2, i);
  }), n;
}
function t2(e) {
  return e && !(e instanceof Headers) && !Array.isArray(e) ? new Headers(
    Object.fromEntries(
      Object.entries(e).filter(([, r]) => r != null).map(([r, n]) => [r, String(n)])
    )
  ) : new Headers(e);
}

// ../../node_modules/.pnpm/@oazapfts+runtime@1.2.0/node_modules/@oazapfts/runtime/index.js
function D2(a3 = {}) {
  async function r(e, n) {
    const t3 = await p(e, n);
    let s2;
    try {
      s2 = await t3.text();
    } catch {
    }
    return {
      status: t3.status,
      headers: t3.headers,
      contentType: t3.headers.get("content-type"),
      data: s2
    };
  }
  async function i(e, n = {}) {
    const { status: t3, headers: s2, contentType: u, data: c } = await r(e, {
      ...n,
      headers: o2(
        {
          Accept: "application/json"
        },
        n.headers
      )
    });
    return (u ? u.includes("json") : false) ? {
      status: t3,
      headers: s2,
      data: c ? JSON.parse(c) : null
    } : { status: t3, headers: s2, data: c };
  }
  async function f(e, n = {}) {
    const t3 = await p(e, n);
    let s2;
    try {
      s2 = await t3.blob();
    } catch {
    }
    return { status: t3.status, headers: t3.headers, data: s2 };
  }
  async function p(e, n = {}) {
    const {
      baseUrl: t3,
      fetch: s2,
      ...u
    } = {
      ...a3,
      ...n,
      headers: o2(a3.headers, n.headers)
    }, c = j3(t3, e);
    return await (s2 || fetch)(c, u);
  }
  return {
    ok: y2,
    fetchText: r,
    fetchJson: i,
    fetchBlob: f,
    mergeHeaders: o2,
    json({ body: e, headers: n, ...t3 }) {
      return {
        ...t3,
        ...e != null && { body: JSON.stringify(e) },
        headers: o2(
          {
            "Content-Type": "application/json"
          },
          n
        )
      };
    },
    form({ body: e, headers: n, ...t3 }) {
      return {
        ...t3,
        ...e != null && { body: A2(e) },
        headers: o2(
          {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          n
        )
      };
    },
    multipart({ body: e, headers: n, ...t3 }) {
      if (e == null)
        return { ...t3, body: e, headers: t2(n) };
      const s2 = new (t3.FormData || t3.formDataConstructor || a3.FormData || a3.formDataConstructor || FormData)(), u = (c, o3) => {
        typeof o3 == "string" || o3 instanceof Blob ? s2.append(c, o3) : typeof o3 == "number" || typeof o3 == "boolean" ? s2.append(c, String(o3)) : s2.append(
          c,
          new Blob([JSON.stringify(o3)], { type: "application/json" })
        );
      };
      return Object.entries(e).forEach(([c, o3]) => {
        Array.isArray(o3) ? o3.forEach((m) => u(c, m)) : u(c, o3);
      }), {
        ...t3,
        body: s2,
        headers: t2(n)
      };
    }
  };
}
var j4 = [200, 201, 202, 204];
async function y2(a3) {
  const r = await a3;
  if (j4.some((i) => i == r.status)) return r.data;
  throw new l4(r.status, r.data, r.headers);
}
var l4 = class extends Error {
  constructor(r, i, f) {
    super(`Error: ${r}`);
    __publicField(this, "status");
    __publicField(this, "data");
    __publicField(this, "headers");
    this.status = r, this.data = i, this.headers = f;
  }
};

// ../sdk/build/fetch-client.js
var defaults2 = {
  headers: {},
  baseUrl: "/api"
};
var oazapfts2 = D2(defaults2);
var ReactionLevel2;
(function(ReactionLevel3) {
  ReactionLevel3["Album"] = "album";
  ReactionLevel3["Asset"] = "asset";
})(ReactionLevel2 || (ReactionLevel2 = {}));
var ReactionType2;
(function(ReactionType3) {
  ReactionType3["Comment"] = "comment";
  ReactionType3["Like"] = "like";
})(ReactionType2 || (ReactionType2 = {}));
var UserAvatarColor2;
(function(UserAvatarColor3) {
  UserAvatarColor3["Primary"] = "primary";
  UserAvatarColor3["Pink"] = "pink";
  UserAvatarColor3["Red"] = "red";
  UserAvatarColor3["Yellow"] = "yellow";
  UserAvatarColor3["Blue"] = "blue";
  UserAvatarColor3["Green"] = "green";
  UserAvatarColor3["Purple"] = "purple";
  UserAvatarColor3["Orange"] = "orange";
  UserAvatarColor3["Gray"] = "gray";
  UserAvatarColor3["Amber"] = "amber";
})(UserAvatarColor2 || (UserAvatarColor2 = {}));
var MaintenanceAction2;
(function(MaintenanceAction3) {
  MaintenanceAction3["Start"] = "start";
  MaintenanceAction3["End"] = "end";
  MaintenanceAction3["SelectDatabaseRestore"] = "select_database_restore";
  MaintenanceAction3["RestoreDatabase"] = "restore_database";
})(MaintenanceAction2 || (MaintenanceAction2 = {}));
var StorageFolder2;
(function(StorageFolder3) {
  StorageFolder3["EncodedVideo"] = "encoded-video";
  StorageFolder3["Library"] = "library";
  StorageFolder3["Upload"] = "upload";
  StorageFolder3["Profile"] = "profile";
  StorageFolder3["Thumbs"] = "thumbs";
  StorageFolder3["Backups"] = "backups";
})(StorageFolder2 || (StorageFolder2 = {}));
var NotificationLevel2;
(function(NotificationLevel3) {
  NotificationLevel3["Success"] = "success";
  NotificationLevel3["Error"] = "error";
  NotificationLevel3["Warning"] = "warning";
  NotificationLevel3["Info"] = "info";
})(NotificationLevel2 || (NotificationLevel2 = {}));
var NotificationType2;
(function(NotificationType3) {
  NotificationType3["JobFailed"] = "JobFailed";
  NotificationType3["BackupFailed"] = "BackupFailed";
  NotificationType3["SystemMessage"] = "SystemMessage";
  NotificationType3["AlbumInvite"] = "AlbumInvite";
  NotificationType3["AlbumUpdate"] = "AlbumUpdate";
  NotificationType3["Custom"] = "Custom";
})(NotificationType2 || (NotificationType2 = {}));
var UserStatus2;
(function(UserStatus3) {
  UserStatus3["Active"] = "active";
  UserStatus3["Removing"] = "removing";
  UserStatus3["Deleted"] = "deleted";
})(UserStatus2 || (UserStatus2 = {}));
var AssetOrder2;
(function(AssetOrder3) {
  AssetOrder3["Asc"] = "asc";
  AssetOrder3["Desc"] = "desc";
})(AssetOrder2 || (AssetOrder2 = {}));
var AssetVisibility2;
(function(AssetVisibility3) {
  AssetVisibility3["Archive"] = "archive";
  AssetVisibility3["Timeline"] = "timeline";
  AssetVisibility3["Hidden"] = "hidden";
  AssetVisibility3["Locked"] = "locked";
})(AssetVisibility2 || (AssetVisibility2 = {}));
var AlbumUserRole2;
(function(AlbumUserRole3) {
  AlbumUserRole3["Editor"] = "editor";
  AlbumUserRole3["Owner"] = "owner";
  AlbumUserRole3["Viewer"] = "viewer";
})(AlbumUserRole2 || (AlbumUserRole2 = {}));
var BulkIdErrorReason2;
(function(BulkIdErrorReason3) {
  BulkIdErrorReason3["Duplicate"] = "duplicate";
  BulkIdErrorReason3["NoPermission"] = "no_permission";
  BulkIdErrorReason3["NotFound"] = "not_found";
  BulkIdErrorReason3["Unknown"] = "unknown";
  BulkIdErrorReason3["Validation"] = "validation";
})(BulkIdErrorReason2 || (BulkIdErrorReason2 = {}));
var Permission2;
(function(Permission3) {
  Permission3["All"] = "all";
  Permission3["ActivityCreate"] = "activity.create";
  Permission3["ActivityRead"] = "activity.read";
  Permission3["ActivityUpdate"] = "activity.update";
  Permission3["ActivityDelete"] = "activity.delete";
  Permission3["ActivityStatistics"] = "activity.statistics";
  Permission3["ApiKeyCreate"] = "apiKey.create";
  Permission3["ApiKeyRead"] = "apiKey.read";
  Permission3["ApiKeyUpdate"] = "apiKey.update";
  Permission3["ApiKeyDelete"] = "apiKey.delete";
  Permission3["AssetRead"] = "asset.read";
  Permission3["AssetUpdate"] = "asset.update";
  Permission3["AssetDelete"] = "asset.delete";
  Permission3["AssetStatistics"] = "asset.statistics";
  Permission3["AssetShare"] = "asset.share";
  Permission3["AssetView"] = "asset.view";
  Permission3["AssetDownload"] = "asset.download";
  Permission3["AssetUpload"] = "asset.upload";
  Permission3["AssetCopy"] = "asset.copy";
  Permission3["AssetDerive"] = "asset.derive";
  Permission3["AssetEditGet"] = "asset.edit.get";
  Permission3["AssetEditCreate"] = "asset.edit.create";
  Permission3["AssetEditDelete"] = "asset.edit.delete";
  Permission3["AlbumCreate"] = "album.create";
  Permission3["AlbumRead"] = "album.read";
  Permission3["AlbumUpdate"] = "album.update";
  Permission3["AlbumDelete"] = "album.delete";
  Permission3["AlbumStatistics"] = "album.statistics";
  Permission3["AlbumShare"] = "album.share";
  Permission3["AlbumDownload"] = "album.download";
  Permission3["AlbumAssetCreate"] = "albumAsset.create";
  Permission3["AlbumAssetDelete"] = "albumAsset.delete";
  Permission3["AlbumUserCreate"] = "albumUser.create";
  Permission3["AlbumUserUpdate"] = "albumUser.update";
  Permission3["AlbumUserDelete"] = "albumUser.delete";
  Permission3["AuthChangePassword"] = "auth.changePassword";
  Permission3["AuthDeviceDelete"] = "authDevice.delete";
  Permission3["ArchiveRead"] = "archive.read";
  Permission3["BackupList"] = "backup.list";
  Permission3["BackupDownload"] = "backup.download";
  Permission3["BackupUpload"] = "backup.upload";
  Permission3["BackupDelete"] = "backup.delete";
  Permission3["DuplicateRead"] = "duplicate.read";
  Permission3["DuplicateDelete"] = "duplicate.delete";
  Permission3["FaceCreate"] = "face.create";
  Permission3["FaceRead"] = "face.read";
  Permission3["FaceUpdate"] = "face.update";
  Permission3["FaceDelete"] = "face.delete";
  Permission3["FolderRead"] = "folder.read";
  Permission3["JobCreate"] = "job.create";
  Permission3["JobRead"] = "job.read";
  Permission3["LibraryCreate"] = "library.create";
  Permission3["LibraryRead"] = "library.read";
  Permission3["LibraryUpdate"] = "library.update";
  Permission3["LibraryDelete"] = "library.delete";
  Permission3["LibraryStatistics"] = "library.statistics";
  Permission3["TimelineRead"] = "timeline.read";
  Permission3["TimelineDownload"] = "timeline.download";
  Permission3["Maintenance"] = "maintenance";
  Permission3["MapRead"] = "map.read";
  Permission3["MapSearch"] = "map.search";
  Permission3["MemoryCreate"] = "memory.create";
  Permission3["MemoryRead"] = "memory.read";
  Permission3["MemoryUpdate"] = "memory.update";
  Permission3["MemoryDelete"] = "memory.delete";
  Permission3["MemoryStatistics"] = "memory.statistics";
  Permission3["MemoryAssetCreate"] = "memoryAsset.create";
  Permission3["MemoryAssetDelete"] = "memoryAsset.delete";
  Permission3["NotificationCreate"] = "notification.create";
  Permission3["NotificationRead"] = "notification.read";
  Permission3["NotificationUpdate"] = "notification.update";
  Permission3["NotificationDelete"] = "notification.delete";
  Permission3["PartnerCreate"] = "partner.create";
  Permission3["PartnerRead"] = "partner.read";
  Permission3["PartnerUpdate"] = "partner.update";
  Permission3["PartnerDelete"] = "partner.delete";
  Permission3["PersonCreate"] = "person.create";
  Permission3["PersonRead"] = "person.read";
  Permission3["PersonUpdate"] = "person.update";
  Permission3["PersonDelete"] = "person.delete";
  Permission3["PersonStatistics"] = "person.statistics";
  Permission3["PersonMerge"] = "person.merge";
  Permission3["PersonReassign"] = "person.reassign";
  Permission3["PinCodeCreate"] = "pinCode.create";
  Permission3["PinCodeUpdate"] = "pinCode.update";
  Permission3["PinCodeDelete"] = "pinCode.delete";
  Permission3["PluginCreate"] = "plugin.create";
  Permission3["PluginRead"] = "plugin.read";
  Permission3["PluginUpdate"] = "plugin.update";
  Permission3["PluginDelete"] = "plugin.delete";
  Permission3["ServerAbout"] = "server.about";
  Permission3["ServerApkLinks"] = "server.apkLinks";
  Permission3["ServerStorage"] = "server.storage";
  Permission3["ServerStatistics"] = "server.statistics";
  Permission3["ServerVersionCheck"] = "server.versionCheck";
  Permission3["ServerLicenseRead"] = "serverLicense.read";
  Permission3["ServerLicenseUpdate"] = "serverLicense.update";
  Permission3["ServerLicenseDelete"] = "serverLicense.delete";
  Permission3["SessionCreate"] = "session.create";
  Permission3["SessionRead"] = "session.read";
  Permission3["SessionUpdate"] = "session.update";
  Permission3["SessionDelete"] = "session.delete";
  Permission3["SessionLock"] = "session.lock";
  Permission3["SharedLinkCreate"] = "sharedLink.create";
  Permission3["SharedLinkRead"] = "sharedLink.read";
  Permission3["SharedLinkUpdate"] = "sharedLink.update";
  Permission3["SharedLinkDelete"] = "sharedLink.delete";
  Permission3["StackCreate"] = "stack.create";
  Permission3["StackRead"] = "stack.read";
  Permission3["StackUpdate"] = "stack.update";
  Permission3["StackDelete"] = "stack.delete";
  Permission3["SyncStream"] = "sync.stream";
  Permission3["SyncCheckpointRead"] = "syncCheckpoint.read";
  Permission3["SyncCheckpointUpdate"] = "syncCheckpoint.update";
  Permission3["SyncCheckpointDelete"] = "syncCheckpoint.delete";
  Permission3["SystemConfigRead"] = "systemConfig.read";
  Permission3["SystemConfigUpdate"] = "systemConfig.update";
  Permission3["SystemMetadataRead"] = "systemMetadata.read";
  Permission3["SystemMetadataUpdate"] = "systemMetadata.update";
  Permission3["TagCreate"] = "tag.create";
  Permission3["TagRead"] = "tag.read";
  Permission3["TagUpdate"] = "tag.update";
  Permission3["TagDelete"] = "tag.delete";
  Permission3["TagAsset"] = "tag.asset";
  Permission3["UserRead"] = "user.read";
  Permission3["UserUpdate"] = "user.update";
  Permission3["UserLicenseCreate"] = "userLicense.create";
  Permission3["UserLicenseRead"] = "userLicense.read";
  Permission3["UserLicenseUpdate"] = "userLicense.update";
  Permission3["UserLicenseDelete"] = "userLicense.delete";
  Permission3["UserOnboardingRead"] = "userOnboarding.read";
  Permission3["UserOnboardingUpdate"] = "userOnboarding.update";
  Permission3["UserOnboardingDelete"] = "userOnboarding.delete";
  Permission3["UserPreferenceRead"] = "userPreference.read";
  Permission3["UserPreferenceUpdate"] = "userPreference.update";
  Permission3["UserProfileImageCreate"] = "userProfileImage.create";
  Permission3["UserProfileImageRead"] = "userProfileImage.read";
  Permission3["UserProfileImageUpdate"] = "userProfileImage.update";
  Permission3["UserProfileImageDelete"] = "userProfileImage.delete";
  Permission3["QueueRead"] = "queue.read";
  Permission3["QueueUpdate"] = "queue.update";
  Permission3["QueueJobCreate"] = "queueJob.create";
  Permission3["QueueJobRead"] = "queueJob.read";
  Permission3["QueueJobUpdate"] = "queueJob.update";
  Permission3["QueueJobDelete"] = "queueJob.delete";
  Permission3["WorkflowCreate"] = "workflow.create";
  Permission3["WorkflowRead"] = "workflow.read";
  Permission3["WorkflowUpdate"] = "workflow.update";
  Permission3["WorkflowDelete"] = "workflow.delete";
  Permission3["AdminUserCreate"] = "adminUser.create";
  Permission3["AdminUserRead"] = "adminUser.read";
  Permission3["AdminUserUpdate"] = "adminUser.update";
  Permission3["AdminUserDelete"] = "adminUser.delete";
  Permission3["AdminSessionRead"] = "adminSession.read";
  Permission3["AdminAuthUnlinkAll"] = "adminAuth.unlinkAll";
})(Permission2 || (Permission2 = {}));
var AssetMediaStatus2;
(function(AssetMediaStatus3) {
  AssetMediaStatus3["Created"] = "created";
  AssetMediaStatus3["Duplicate"] = "duplicate";
})(AssetMediaStatus2 || (AssetMediaStatus2 = {}));
var AssetUploadAction2;
(function(AssetUploadAction3) {
  AssetUploadAction3["Accept"] = "accept";
  AssetUploadAction3["Reject"] = "reject";
})(AssetUploadAction2 || (AssetUploadAction2 = {}));
var AssetRejectReason2;
(function(AssetRejectReason3) {
  AssetRejectReason3["Duplicate"] = "duplicate";
  AssetRejectReason3["UnsupportedFormat"] = "unsupported-format";
})(AssetRejectReason2 || (AssetRejectReason2 = {}));
var AssetJobName2;
(function(AssetJobName3) {
  AssetJobName3["RefreshFaces"] = "refresh-faces";
  AssetJobName3["RefreshMetadata"] = "refresh-metadata";
  AssetJobName3["RegenerateThumbnail"] = "regenerate-thumbnail";
  AssetJobName3["TranscodeVideo"] = "transcode-video";
})(AssetJobName2 || (AssetJobName2 = {}));
var AssetTypeEnum2;
(function(AssetTypeEnum3) {
  AssetTypeEnum3["Image"] = "IMAGE";
  AssetTypeEnum3["Video"] = "VIDEO";
  AssetTypeEnum3["Audio"] = "AUDIO";
  AssetTypeEnum3["Other"] = "OTHER";
})(AssetTypeEnum2 || (AssetTypeEnum2 = {}));
var AssetEditAction2;
(function(AssetEditAction3) {
  AssetEditAction3["Crop"] = "crop";
  AssetEditAction3["Rotate"] = "rotate";
  AssetEditAction3["Mirror"] = "mirror";
})(AssetEditAction2 || (AssetEditAction2 = {}));
var MirrorAxis2;
(function(MirrorAxis3) {
  MirrorAxis3["Horizontal"] = "horizontal";
  MirrorAxis3["Vertical"] = "vertical";
})(MirrorAxis2 || (MirrorAxis2 = {}));
var AssetMediaSize2;
(function(AssetMediaSize3) {
  AssetMediaSize3["Original"] = "original";
  AssetMediaSize3["Fullsize"] = "fullsize";
  AssetMediaSize3["Preview"] = "preview";
  AssetMediaSize3["Thumbnail"] = "thumbnail";
})(AssetMediaSize2 || (AssetMediaSize2 = {}));
var SourceType2;
(function(SourceType3) {
  SourceType3["MachineLearning"] = "machine-learning";
  SourceType3["Exif"] = "exif";
  SourceType3["Manual"] = "manual";
})(SourceType2 || (SourceType2 = {}));
var ManualJobName2;
(function(ManualJobName3) {
  ManualJobName3["PersonCleanup"] = "person-cleanup";
  ManualJobName3["TagCleanup"] = "tag-cleanup";
  ManualJobName3["UserCleanup"] = "user-cleanup";
  ManualJobName3["MemoryCleanup"] = "memory-cleanup";
  ManualJobName3["MemoryCreate"] = "memory-create";
  ManualJobName3["BackupDatabase"] = "backup-database";
})(ManualJobName2 || (ManualJobName2 = {}));
var QueueName2;
(function(QueueName3) {
  QueueName3["ThumbnailGeneration"] = "thumbnailGeneration";
  QueueName3["MetadataExtraction"] = "metadataExtraction";
  QueueName3["VideoConversion"] = "videoConversion";
  QueueName3["FaceDetection"] = "faceDetection";
  QueueName3["FacialRecognition"] = "facialRecognition";
  QueueName3["SmartSearch"] = "smartSearch";
  QueueName3["DuplicateDetection"] = "duplicateDetection";
  QueueName3["BackgroundTask"] = "backgroundTask";
  QueueName3["StorageTemplateMigration"] = "storageTemplateMigration";
  QueueName3["Migration"] = "migration";
  QueueName3["Search"] = "search";
  QueueName3["Sidecar"] = "sidecar";
  QueueName3["Library"] = "library";
  QueueName3["Notifications"] = "notifications";
  QueueName3["BackupDatabase"] = "backupDatabase";
  QueueName3["Ocr"] = "ocr";
  QueueName3["Workflow"] = "workflow";
  QueueName3["Editor"] = "editor";
})(QueueName2 || (QueueName2 = {}));
var QueueCommand2;
(function(QueueCommand3) {
  QueueCommand3["Start"] = "start";
  QueueCommand3["Pause"] = "pause";
  QueueCommand3["Resume"] = "resume";
  QueueCommand3["Empty"] = "empty";
  QueueCommand3["ClearFailed"] = "clear-failed";
})(QueueCommand2 || (QueueCommand2 = {}));
var MemorySearchOrder2;
(function(MemorySearchOrder3) {
  MemorySearchOrder3["Asc"] = "asc";
  MemorySearchOrder3["Desc"] = "desc";
  MemorySearchOrder3["Random"] = "random";
})(MemorySearchOrder2 || (MemorySearchOrder2 = {}));
var MemoryType2;
(function(MemoryType3) {
  MemoryType3["OnThisDay"] = "on_this_day";
})(MemoryType2 || (MemoryType2 = {}));
var PartnerDirection2;
(function(PartnerDirection3) {
  PartnerDirection3["SharedBy"] = "shared-by";
  PartnerDirection3["SharedWith"] = "shared-with";
})(PartnerDirection2 || (PartnerDirection2 = {}));
var WorkflowType2;
(function(WorkflowType4) {
  WorkflowType4["AssetV1"] = "AssetV1";
  WorkflowType4["AssetPersonV1"] = "AssetPersonV1";
})(WorkflowType2 || (WorkflowType2 = {}));
var WorkflowTrigger2;
(function(WorkflowTrigger3) {
  WorkflowTrigger3["AssetCreate"] = "AssetCreate";
  WorkflowTrigger3["AssetMetadataExtraction"] = "AssetMetadataExtraction";
  WorkflowTrigger3["PersonRecognized"] = "PersonRecognized";
})(WorkflowTrigger2 || (WorkflowTrigger2 = {}));
var QueueJobStatus2;
(function(QueueJobStatus3) {
  QueueJobStatus3["Active"] = "active";
  QueueJobStatus3["Failed"] = "failed";
  QueueJobStatus3["Completed"] = "completed";
  QueueJobStatus3["Delayed"] = "delayed";
  QueueJobStatus3["Waiting"] = "waiting";
  QueueJobStatus3["Paused"] = "paused";
})(QueueJobStatus2 || (QueueJobStatus2 = {}));
var JobName2;
(function(JobName3) {
  JobName3["AssetDelete"] = "AssetDelete";
  JobName3["AssetDeleteCheck"] = "AssetDeleteCheck";
  JobName3["AssetDetectFacesQueueAll"] = "AssetDetectFacesQueueAll";
  JobName3["AssetDetectFaces"] = "AssetDetectFaces";
  JobName3["AssetDetectDuplicatesQueueAll"] = "AssetDetectDuplicatesQueueAll";
  JobName3["AssetDetectDuplicates"] = "AssetDetectDuplicates";
  JobName3["AssetEditThumbnailGeneration"] = "AssetEditThumbnailGeneration";
  JobName3["AssetEncodeVideoQueueAll"] = "AssetEncodeVideoQueueAll";
  JobName3["AssetEncodeVideo"] = "AssetEncodeVideo";
  JobName3["AssetEmptyTrash"] = "AssetEmptyTrash";
  JobName3["AssetExtractMetadataQueueAll"] = "AssetExtractMetadataQueueAll";
  JobName3["AssetExtractMetadata"] = "AssetExtractMetadata";
  JobName3["AssetFileMigration"] = "AssetFileMigration";
  JobName3["AssetGenerateThumbnailsQueueAll"] = "AssetGenerateThumbnailsQueueAll";
  JobName3["AssetGenerateThumbnails"] = "AssetGenerateThumbnails";
  JobName3["AuditTableCleanup"] = "AuditTableCleanup";
  JobName3["DatabaseBackup"] = "DatabaseBackup";
  JobName3["FacialRecognitionQueueAll"] = "FacialRecognitionQueueAll";
  JobName3["FacialRecognition"] = "FacialRecognition";
  JobName3["FileDelete"] = "FileDelete";
  JobName3["FileMigrationQueueAll"] = "FileMigrationQueueAll";
  JobName3["LibraryDeleteCheck"] = "LibraryDeleteCheck";
  JobName3["LibraryDelete"] = "LibraryDelete";
  JobName3["LibraryRemoveAsset"] = "LibraryRemoveAsset";
  JobName3["LibraryScanAssetsQueueAll"] = "LibraryScanAssetsQueueAll";
  JobName3["LibrarySyncAssets"] = "LibrarySyncAssets";
  JobName3["LibrarySyncFilesQueueAll"] = "LibrarySyncFilesQueueAll";
  JobName3["LibrarySyncFiles"] = "LibrarySyncFiles";
  JobName3["LibraryScanQueueAll"] = "LibraryScanQueueAll";
  JobName3["MemoryCleanup"] = "MemoryCleanup";
  JobName3["MemoryGenerate"] = "MemoryGenerate";
  JobName3["NotificationsCleanup"] = "NotificationsCleanup";
  JobName3["NotifyUserSignup"] = "NotifyUserSignup";
  JobName3["NotifyAlbumInvite"] = "NotifyAlbumInvite";
  JobName3["NotifyAlbumUpdate"] = "NotifyAlbumUpdate";
  JobName3["UserDelete"] = "UserDelete";
  JobName3["UserDeleteCheck"] = "UserDeleteCheck";
  JobName3["UserSyncUsage"] = "UserSyncUsage";
  JobName3["PersonCleanup"] = "PersonCleanup";
  JobName3["PersonFileMigration"] = "PersonFileMigration";
  JobName3["PersonGenerateThumbnail"] = "PersonGenerateThumbnail";
  JobName3["SessionCleanup"] = "SessionCleanup";
  JobName3["SendMail"] = "SendMail";
  JobName3["SidecarQueueAll"] = "SidecarQueueAll";
  JobName3["SidecarCheck"] = "SidecarCheck";
  JobName3["SidecarWrite"] = "SidecarWrite";
  JobName3["SmartSearchQueueAll"] = "SmartSearchQueueAll";
  JobName3["SmartSearch"] = "SmartSearch";
  JobName3["StorageTemplateMigration"] = "StorageTemplateMigration";
  JobName3["StorageTemplateMigrationSingle"] = "StorageTemplateMigrationSingle";
  JobName3["TagCleanup"] = "TagCleanup";
  JobName3["VersionCheck"] = "VersionCheck";
  JobName3["OcrQueueAll"] = "OcrQueueAll";
  JobName3["Ocr"] = "Ocr";
  JobName3["WorkflowAssetTrigger"] = "WorkflowAssetTrigger";
})(JobName2 || (JobName2 = {}));
var SearchSuggestionType2;
(function(SearchSuggestionType3) {
  SearchSuggestionType3["Country"] = "country";
  SearchSuggestionType3["State"] = "state";
  SearchSuggestionType3["City"] = "city";
  SearchSuggestionType3["CameraMake"] = "camera-make";
  SearchSuggestionType3["CameraModel"] = "camera-model";
  SearchSuggestionType3["CameraLensModel"] = "camera-lens-model";
})(SearchSuggestionType2 || (SearchSuggestionType2 = {}));
var SharedLinkType2;
(function(SharedLinkType3) {
  SharedLinkType3["Album"] = "ALBUM";
  SharedLinkType3["Individual"] = "INDIVIDUAL";
})(SharedLinkType2 || (SharedLinkType2 = {}));
var AssetIdErrorReason2;
(function(AssetIdErrorReason3) {
  AssetIdErrorReason3["Duplicate"] = "duplicate";
  AssetIdErrorReason3["NoPermission"] = "no_permission";
  AssetIdErrorReason3["NotFound"] = "not_found";
})(AssetIdErrorReason2 || (AssetIdErrorReason2 = {}));
var SyncEntityType2;
(function(SyncEntityType3) {
  SyncEntityType3["AuthUserV1"] = "AuthUserV1";
  SyncEntityType3["UserV1"] = "UserV1";
  SyncEntityType3["UserDeleteV1"] = "UserDeleteV1";
  SyncEntityType3["AssetV1"] = "AssetV1";
  SyncEntityType3["AssetV2"] = "AssetV2";
  SyncEntityType3["AssetDeleteV1"] = "AssetDeleteV1";
  SyncEntityType3["AssetExifV1"] = "AssetExifV1";
  SyncEntityType3["AssetEditV1"] = "AssetEditV1";
  SyncEntityType3["AssetEditDeleteV1"] = "AssetEditDeleteV1";
  SyncEntityType3["AssetMetadataV1"] = "AssetMetadataV1";
  SyncEntityType3["AssetMetadataDeleteV1"] = "AssetMetadataDeleteV1";
  SyncEntityType3["PartnerV1"] = "PartnerV1";
  SyncEntityType3["PartnerDeleteV1"] = "PartnerDeleteV1";
  SyncEntityType3["PartnerAssetV1"] = "PartnerAssetV1";
  SyncEntityType3["PartnerAssetV2"] = "PartnerAssetV2";
  SyncEntityType3["PartnerAssetBackfillV1"] = "PartnerAssetBackfillV1";
  SyncEntityType3["PartnerAssetBackfillV2"] = "PartnerAssetBackfillV2";
  SyncEntityType3["PartnerAssetDeleteV1"] = "PartnerAssetDeleteV1";
  SyncEntityType3["PartnerAssetExifV1"] = "PartnerAssetExifV1";
  SyncEntityType3["PartnerAssetExifBackfillV1"] = "PartnerAssetExifBackfillV1";
  SyncEntityType3["PartnerStackBackfillV1"] = "PartnerStackBackfillV1";
  SyncEntityType3["PartnerStackDeleteV1"] = "PartnerStackDeleteV1";
  SyncEntityType3["PartnerStackV1"] = "PartnerStackV1";
  SyncEntityType3["AlbumV1"] = "AlbumV1";
  SyncEntityType3["AlbumV2"] = "AlbumV2";
  SyncEntityType3["AlbumDeleteV1"] = "AlbumDeleteV1";
  SyncEntityType3["AlbumUserV1"] = "AlbumUserV1";
  SyncEntityType3["AlbumUserBackfillV1"] = "AlbumUserBackfillV1";
  SyncEntityType3["AlbumUserDeleteV1"] = "AlbumUserDeleteV1";
  SyncEntityType3["AlbumAssetCreateV1"] = "AlbumAssetCreateV1";
  SyncEntityType3["AlbumAssetCreateV2"] = "AlbumAssetCreateV2";
  SyncEntityType3["AlbumAssetUpdateV1"] = "AlbumAssetUpdateV1";
  SyncEntityType3["AlbumAssetUpdateV2"] = "AlbumAssetUpdateV2";
  SyncEntityType3["AlbumAssetBackfillV1"] = "AlbumAssetBackfillV1";
  SyncEntityType3["AlbumAssetBackfillV2"] = "AlbumAssetBackfillV2";
  SyncEntityType3["AlbumAssetExifCreateV1"] = "AlbumAssetExifCreateV1";
  SyncEntityType3["AlbumAssetExifUpdateV1"] = "AlbumAssetExifUpdateV1";
  SyncEntityType3["AlbumAssetExifBackfillV1"] = "AlbumAssetExifBackfillV1";
  SyncEntityType3["AlbumToAssetV1"] = "AlbumToAssetV1";
  SyncEntityType3["AlbumToAssetDeleteV1"] = "AlbumToAssetDeleteV1";
  SyncEntityType3["AlbumToAssetBackfillV1"] = "AlbumToAssetBackfillV1";
  SyncEntityType3["MemoryV1"] = "MemoryV1";
  SyncEntityType3["MemoryDeleteV1"] = "MemoryDeleteV1";
  SyncEntityType3["MemoryToAssetV1"] = "MemoryToAssetV1";
  SyncEntityType3["MemoryToAssetDeleteV1"] = "MemoryToAssetDeleteV1";
  SyncEntityType3["StackV1"] = "StackV1";
  SyncEntityType3["StackDeleteV1"] = "StackDeleteV1";
  SyncEntityType3["PersonV1"] = "PersonV1";
  SyncEntityType3["PersonDeleteV1"] = "PersonDeleteV1";
  SyncEntityType3["AssetFaceV1"] = "AssetFaceV1";
  SyncEntityType3["AssetFaceV2"] = "AssetFaceV2";
  SyncEntityType3["AssetFaceDeleteV1"] = "AssetFaceDeleteV1";
  SyncEntityType3["UserMetadataV1"] = "UserMetadataV1";
  SyncEntityType3["UserMetadataDeleteV1"] = "UserMetadataDeleteV1";
  SyncEntityType3["SyncAckV1"] = "SyncAckV1";
  SyncEntityType3["SyncResetV1"] = "SyncResetV1";
  SyncEntityType3["SyncCompleteV1"] = "SyncCompleteV1";
})(SyncEntityType2 || (SyncEntityType2 = {}));
var SyncRequestType2;
(function(SyncRequestType3) {
  SyncRequestType3["AlbumsV1"] = "AlbumsV1";
  SyncRequestType3["AlbumsV2"] = "AlbumsV2";
  SyncRequestType3["AlbumUsersV1"] = "AlbumUsersV1";
  SyncRequestType3["AlbumToAssetsV1"] = "AlbumToAssetsV1";
  SyncRequestType3["AlbumAssetsV1"] = "AlbumAssetsV1";
  SyncRequestType3["AlbumAssetsV2"] = "AlbumAssetsV2";
  SyncRequestType3["AlbumAssetExifsV1"] = "AlbumAssetExifsV1";
  SyncRequestType3["AssetsV1"] = "AssetsV1";
  SyncRequestType3["AssetsV2"] = "AssetsV2";
  SyncRequestType3["AssetExifsV1"] = "AssetExifsV1";
  SyncRequestType3["AssetEditsV1"] = "AssetEditsV1";
  SyncRequestType3["AssetMetadataV1"] = "AssetMetadataV1";
  SyncRequestType3["AuthUsersV1"] = "AuthUsersV1";
  SyncRequestType3["MemoriesV1"] = "MemoriesV1";
  SyncRequestType3["MemoryToAssetsV1"] = "MemoryToAssetsV1";
  SyncRequestType3["PartnersV1"] = "PartnersV1";
  SyncRequestType3["PartnerAssetsV1"] = "PartnerAssetsV1";
  SyncRequestType3["PartnerAssetsV2"] = "PartnerAssetsV2";
  SyncRequestType3["PartnerAssetExifsV1"] = "PartnerAssetExifsV1";
  SyncRequestType3["PartnerStacksV1"] = "PartnerStacksV1";
  SyncRequestType3["StacksV1"] = "StacksV1";
  SyncRequestType3["UsersV1"] = "UsersV1";
  SyncRequestType3["PeopleV1"] = "PeopleV1";
  SyncRequestType3["AssetFacesV1"] = "AssetFacesV1";
  SyncRequestType3["AssetFacesV2"] = "AssetFacesV2";
  SyncRequestType3["UserMetadataV1"] = "UserMetadataV1";
})(SyncRequestType2 || (SyncRequestType2 = {}));
var TranscodeHWAccel2;
(function(TranscodeHWAccel3) {
  TranscodeHWAccel3["Nvenc"] = "nvenc";
  TranscodeHWAccel3["Qsv"] = "qsv";
  TranscodeHWAccel3["Vaapi"] = "vaapi";
  TranscodeHWAccel3["Rkmpp"] = "rkmpp";
  TranscodeHWAccel3["Disabled"] = "disabled";
})(TranscodeHWAccel2 || (TranscodeHWAccel2 = {}));
var AudioCodec2;
(function(AudioCodec3) {
  AudioCodec3["Mp3"] = "mp3";
  AudioCodec3["Aac"] = "aac";
  AudioCodec3["Opus"] = "opus";
  AudioCodec3["PcmS16Le"] = "pcm_s16le";
})(AudioCodec2 || (AudioCodec2 = {}));
var VideoContainer2;
(function(VideoContainer3) {
  VideoContainer3["Mov"] = "mov";
  VideoContainer3["Mp4"] = "mp4";
  VideoContainer3["Ogg"] = "ogg";
  VideoContainer3["Webm"] = "webm";
})(VideoContainer2 || (VideoContainer2 = {}));
var VideoCodec2;
(function(VideoCodec3) {
  VideoCodec3["H264"] = "h264";
  VideoCodec3["Hevc"] = "hevc";
  VideoCodec3["Vp9"] = "vp9";
  VideoCodec3["Av1"] = "av1";
})(VideoCodec2 || (VideoCodec2 = {}));
var CQMode2;
(function(CQMode3) {
  CQMode3["Auto"] = "auto";
  CQMode3["Cqp"] = "cqp";
  CQMode3["Icq"] = "icq";
})(CQMode2 || (CQMode2 = {}));
var ToneMapping2;
(function(ToneMapping3) {
  ToneMapping3["Hable"] = "hable";
  ToneMapping3["Mobius"] = "mobius";
  ToneMapping3["Reinhard"] = "reinhard";
  ToneMapping3["Disabled"] = "disabled";
})(ToneMapping2 || (ToneMapping2 = {}));
var TranscodePolicy2;
(function(TranscodePolicy3) {
  TranscodePolicy3["All"] = "all";
  TranscodePolicy3["Optimal"] = "optimal";
  TranscodePolicy3["Bitrate"] = "bitrate";
  TranscodePolicy3["Required"] = "required";
  TranscodePolicy3["Disabled"] = "disabled";
})(TranscodePolicy2 || (TranscodePolicy2 = {}));
var Colorspace2;
(function(Colorspace3) {
  Colorspace3["Srgb"] = "srgb";
  Colorspace3["P3"] = "p3";
})(Colorspace2 || (Colorspace2 = {}));
var ImageFormat2;
(function(ImageFormat3) {
  ImageFormat3["Jpeg"] = "jpeg";
  ImageFormat3["Webp"] = "webp";
})(ImageFormat2 || (ImageFormat2 = {}));
var LogLevel2;
(function(LogLevel3) {
  LogLevel3["Verbose"] = "verbose";
  LogLevel3["Debug"] = "debug";
  LogLevel3["Log"] = "log";
  LogLevel3["Warn"] = "warn";
  LogLevel3["Error"] = "error";
  LogLevel3["Fatal"] = "fatal";
})(LogLevel2 || (LogLevel2 = {}));
var OAuthTokenEndpointAuthMethod2;
(function(OAuthTokenEndpointAuthMethod3) {
  OAuthTokenEndpointAuthMethod3["ClientSecretPost"] = "client_secret_post";
  OAuthTokenEndpointAuthMethod3["ClientSecretBasic"] = "client_secret_basic";
})(OAuthTokenEndpointAuthMethod2 || (OAuthTokenEndpointAuthMethod2 = {}));
var AssetOrderBy2;
(function(AssetOrderBy3) {
  AssetOrderBy3["TakenAt"] = "takenAt";
  AssetOrderBy3["CreatedAt"] = "createdAt";
})(AssetOrderBy2 || (AssetOrderBy2 = {}));
var UserMetadataKey2;
(function(UserMetadataKey3) {
  UserMetadataKey3["Preferences"] = "preferences";
  UserMetadataKey3["License"] = "license";
  UserMetadataKey3["Onboarding"] = "onboarding";
})(UserMetadataKey2 || (UserMetadataKey2 = {}));

// src/index.ts
var assetFileFilter = () => {
  return wrapper(({ data, config }) => {
    const { pattern, matchType = "contains", caseSensitive = false } = config;
    const { asset } = data;
    const fileName = asset.originalFileName || "";
    const searchName = caseSensitive ? fileName : fileName.toLowerCase();
    const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();
    switch (matchType) {
      case "contains": {
        return { workflow: { continue: searchName.includes(searchPattern) } };
      }
      case "exact": {
        return { workflow: { continue: searchName === searchPattern } };
      }
      case "startsWith": {
        return { workflow: { continue: searchName.startsWith(searchPattern) } };
      }
      case "regex": {
        const flags = caseSensitive ? "" : "i";
        const regex = new RegExp(searchPattern, flags);
        return { workflow: { continue: regex.test(fileName) } };
      }
      default: {
        return {};
      }
    }
  });
};
var assetMissingTimeZoneFilter = () => {
  return wrapper(({ config, data }) => {
    const hasTimeZone = !!data.asset?.exifInfo?.timeZone;
    const needsTimeZone = config.inverse ? true : false;
    return { workflow: { continue: hasTimeZone === needsTimeZone } };
  });
};
var assetFavorite = () => {
  return wrapper(({ config, data }) => {
    const target = config.inverse ? false : true;
    if (target !== data.asset.isFavorite) {
      return {
        changes: {
          asset: { isFavorite: target }
        }
      };
    }
  });
};
var assetVisibility = () => {
  return wrapper(({ config }) => ({
    changes: { asset: { visibility: config.visibility } }
  }));
};
var assetArchive = () => {
  return wrapper(({ config, data }) => {
    if (!config.inverse && data.asset.visibility !== AssetVisibility2.Archive) {
      return { changes: { asset: { visibility: AssetVisibility2.Archive } } };
    }
    if (config.inverse && data.asset.visibility === AssetVisibility2.Archive) {
      return { changes: { asset: { visibility: AssetVisibility2.Timeline } } };
    }
    return {};
  });
};
var assetLock = () => {
  return wrapper(({ config, data }) => {
    if (!config.inverse && data.asset.visibility !== AssetVisibility2.Locked) {
      return { changes: { asset: { visibility: AssetVisibility2.Locked } } };
    }
    if (config.inverse && data.asset.visibility === AssetVisibility2.Locked) {
      return { changes: { asset: { visibility: AssetVisibility2.Timeline } } };
    }
    return {};
  });
};
var assetTrash = () => {
  return wrapper(() => ({}));
};
var assetAddToAlbums = () => {
  return wrapper(({ config, data, functions }) => {
    const assetId = data.asset.id;
    if (config.albumIds.length === 0) {
      if (!config.albumName) {
        return {};
      }
      const [existing] = functions.searchAlbums({ name: config.albumName });
      if (!existing) {
        const created = functions.createAlbum({ albumName: config.albumName, assetIds: [assetId] });
        config.albumIds.push(created.id);
        return {};
      }
      config.albumIds.push(existing.id);
    }
    if (config.albumIds.length === 1) {
      functions.addAssetsToAlbum(config.albumIds[0], [assetId]);
      return {};
    }
    functions.addAssetsToAlbums({ albumIds: config.albumIds, assetIds: [assetId] });
    return {};
  });
};
