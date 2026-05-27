import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';

enum MetadataScope {
  user, // keys with this scope are deleted on logout
  system;

  const MetadataScope();
}

enum MetadataKey<T extends Object> {
  // Theme
  themePrimaryColor<ImmichColorPreset>(codec: _EnumCodec(ImmichColorPreset.values)),
  themeMode<ThemeMode>(codec: _EnumCodec(ThemeMode.values)),
  themeDynamic<bool>(),
  themeColorfulInterface<bool>(),

  // Image
  imagePreferRemote<bool>(),
  imageLoadOriginal<bool>(),

  // Viewer
  viewerLoopVideo<bool>(),
  viewerLoadOriginalVideo<bool>(),
  viewerAutoPlayVideo<bool>(),
  viewerTapToNavigate<bool>(),

  // Network
  networkAutoEndpointSwitching<bool>(scope: .system),
  networkPreferredWifiName<String>(scope: .system),
  networkLocalEndpoint<String>(scope: .system),
  networkExternalEndpointList<List<String>>(scope: .system, codec: _ListCodec(_PrimitiveCodec.string)),
  networkCustomHeaders<Map<String, String>>(
    scope: .system,
    codec: _MapCodec(_PrimitiveCodec.string, _PrimitiveCodec.string),
  ),

  // Album
  albumSortMode<AlbumSortMode>(codec: _EnumCodec(AlbumSortMode.values)),
  albumIsReverse<bool>(),
  albumIsGrid<bool>(),

  // Backup
  backupEnabled<bool>(),
  backupUseCellularForVideos<bool>(),
  backupUseCellularForPhotos<bool>(),
  backupRequireCharging<bool>(),
  backupTriggerDelay<int>(),
  backupSyncAlbums<bool>(),

  // Timeline
  timelineTilesPerRow<int>(),
  timelineGroupAssetsBy<GroupAssetsBy>(codec: _EnumCodec(GroupAssetsBy.values)),
  timelineStorageIndicator<bool>(),

  // Log
  logLevel<LogLevel>(scope: .system, codec: _EnumCodec(LogLevel.values)),

  // Map
  mapShowFavoriteOnly<bool>(),
  mapRelativeDate<int>(),
  mapIncludeArchived<bool>(),
  mapThemeMode<ThemeMode>(codec: _EnumCodec(ThemeMode.values)),
  mapWithPartners<bool>(),

  // Cleanup
  cleanupKeepFavorites<bool>(),
  cleanupKeepMediaType<AssetKeepType>(codec: _EnumCodec(AssetKeepType.values)),
  cleanupKeepAlbumIds<List<String>>(codec: _ListCodec(_PrimitiveCodec.string)),
  cleanupCutoffDaysAgo<int>(),
  cleanupDefaultsInitialized<bool>(),

  // Slideshow
  slideshowTransition<bool>(),
  slideshowRepeat<bool>(),
  slideshowDuration<int>(),
  slideshowLook<SlideshowLook>(codec: _EnumCodec(SlideshowLook.values)),
  slideshowDirection<SlideshowDirection>(codec: _EnumCodec(SlideshowDirection.values));

  final MetadataScope scope;
  final _MetadataCodec<T>? _codecOverride;

  const MetadataKey({this.scope = .user, _MetadataCodec<T>? codec}) : _codecOverride = codec;

  _MetadataCodec<T> get _codec => _codecOverride ?? _MetadataCodec.forType(T);

  String encode(T value) => _codec.encode(value);

  T decode(String raw) => _codec.decode(raw);
}

sealed class _MetadataCodec<T extends Object> {
  const _MetadataCodec();

  String encode(T value);
  T decode(String raw);

  static const Map<Type, _MetadataCodec<Object>> _primitives = {
    int: _PrimitiveCodec.integer,
    double: _PrimitiveCodec.real,
    bool: _PrimitiveCodec.boolean,
    String: _PrimitiveCodec.string,
    DateTime: _DateTimeCodec(),
  };

  static _MetadataCodec<T> forType<T extends Object>(Type runtimeType) {
    final codec = _primitives[runtimeType];
    if (codec == null) {
      throw StateError('No primitive codec for $runtimeType. Provide an explicit codec when defining the MetadataKey.');
    }
    return codec as _MetadataCodec<T>;
  }
}

final class _EnumCodec<T extends Enum> extends _MetadataCodec<T> {
  final List<T> values;

  const _EnumCodec(this.values);

  @override
  String encode(T value) => value.name;

  @override
  T decode(String raw) => values.firstWhere((v) => v.name == raw);
}

final class _DateTimeCodec extends _MetadataCodec<DateTime> {
  const _DateTimeCodec();

  @override
  String encode(DateTime value) => value.toIso8601String();

  @override
  DateTime decode(String raw) => DateTime.parse(raw);
}

final class _MapCodec<K extends Object, V extends Object> extends _MetadataCodec<Map<K, V>> {
  final _MetadataCodec<K> _keyCodec;
  final _MetadataCodec<V> _valueCodec;

  const _MapCodec(this._keyCodec, this._valueCodec);

  @override
  String encode(Map<K, V> value) {
    final entries = <String, String>{};
    value.forEach((k, v) => entries[_keyCodec.encode(k)] = _valueCodec.encode(v));
    return jsonEncode(entries);
  }

  @override
  Map<K, V> decode(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return {};
      }
      final result = <K, V>{};
      for (final entry in decoded.entries) {
        final rawKey = entry.key;
        final rawValue = entry.value;
        if (rawKey is! String || rawValue is! String) {
          return {};
        }
        final k = _keyCodec.decode(rawKey);
        final v = _valueCodec.decode(rawValue);
        result[k] = v;
      }
      return result;
    } on FormatException {
      return {};
    }
  }
}

final class _ListCodec<T extends Object> extends _MetadataCodec<List<T>> {
  final _MetadataCodec<T> _elementCodec;

  const _ListCodec(this._elementCodec);

  @override
  String encode(List<T> value) => jsonEncode(value.map(_elementCodec.encode).toList());

  @override
  List<T> decode(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) {
        return [];
      }
      final result = <T>[];
      for (final item in decoded) {
        if (item is! String) {
          return [];
        }
        final element = _elementCodec.decode(item);
        result.add(element);
      }
      return result;
    } on FormatException {
      return [];
    }
  }
}

final class _PrimitiveCodec<T extends Object> extends _MetadataCodec<T> {
  final T Function(String) _parse;

  const _PrimitiveCodec._(this._parse);

  @override
  String encode(T value) => value.toString();

  @override
  T decode(String raw) => _parse(raw);

  static const integer = _PrimitiveCodec<int>._(int.parse);
  static const real = _PrimitiveCodec<double>._(double.parse);
  static const boolean = _PrimitiveCodec<bool>._(bool.parse);
  static const string = _PrimitiveCodec<String>._(_identity);

  static String _identity(String s) => s;
}
