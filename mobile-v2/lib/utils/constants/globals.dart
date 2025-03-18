import 'package:flutter/material.dart';

/// Log messages stored in the DB
const int kLogMessageLimit = 500;

/// Cache constants
const int kCacheStalePeriod = 30; // in days
const String kCacheFullImagesKey = 'ImFullImageCacheKey';
const int kCacheMaxNrOfFullImages = 500;
const String kCacheThumbnailsKey = 'ImThumbnailCacheKey';
const int kCacheMaxNrOfThumbnails = 500;

/// Grid constants
const double kGridAutoHideAppBarOffset = 30;
const int kGridThumbnailSize = 200;
const int kGridThumbnailQuality = 80;

/// RenderList constants
const int kRenderListBatchSize = 256;
const int kRenderListOppositeBatchSize = 64;

/// Sync constants
const int kFullSyncChunkSize = 10000;
const int kHashAssetsFileLimit = 128;
const int kHashAssetsSizeLimit = 1024 * 1024 * 1024; // 1GB

/// Headers
// Auth header
const String kImmichHeaderAuthKey = "x-immich-user-token";
const String kImmichHeaderDeviceModel = "deviceModel";
const String kImmichHeaderDeviceType = "deviceType";

/// Global ScaffoldMessengerKey to show snackbars
final GlobalKey<ScaffoldMessengerState> kScafMessengerKey = GlobalKey();
