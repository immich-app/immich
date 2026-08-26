// ignore_for_file: annotate_overrides

import 'package:background_downloader/background_downloader.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'download_state.model.freezed.dart';

@freezed
class const DownloadInfo({
  required final String fileName,
  required final double progress,
  required final TaskStatus status,
}) with _$DownloadInfo;

@freezed
class const DownloadState({
  required final TaskStatus downloadStatus,
  required final Map<String, DownloadInfo> taskProgress,
  required final bool showProgress,
}) with _$DownloadState;
