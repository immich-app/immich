import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/system_config.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';

enum MetadataDomain<T extends Object> {
  appConfig<AppConfig>('config.app'),
  systemConfig<SystemConfig>('config.system');

  final String prefix;
  const MetadataDomain(this.prefix);
}

enum MetadataKey<T extends Object> {
  // Theme
  themePrimaryColor<ImmichColorPreset>(.appConfig, 'theme.primaryColor', .indigo, _EnumCodec(ImmichColorPreset.values)),
  themeMode<ThemeMode>(.appConfig, 'theme.mode', .system, _EnumCodec(ThemeMode.values)),
  themeDynamic<bool>(.appConfig, 'theme.dynamic', false),
  themeColorfulInterface<bool>(.appConfig, 'theme.colorfulInterface', true),

  // Image
  imagePreferRemote<bool>(.appConfig, 'image.preferRemote', false),
  imageLoadOriginal<bool>(.appConfig, 'image.loadOriginal', false),

  // Viewer
  viewerLoopVideo<bool>(.appConfig, 'viewer.loopVideo', true),
  viewerLoadOriginalVideo<bool>(.appConfig, 'viewer.loadOriginalVideo', false),
  viewerAutoPlayVideo<bool>(.appConfig, 'viewer.autoPlayVideo', true),
  viewerTapToNavigate<bool>(.appConfig, 'viewer.tapToNavigate', false),

  // Network
  networkAutoEndpointSwitching<bool>(.systemConfig, 'network.autoEndpointSwitching', false),
  networkPreferredWifiName<String>(.systemConfig, 'network.preferredWifiName', ''),
  networkLocalEndpoint<String>(.systemConfig, 'network.localEndpoint', ''),
  networkExternalEndpointList<List<String>>(
    .systemConfig,
    'network.externalEndpointList',
    [],
    _ListCodec(_PrimitiveCodec.string),
  ),
  networkCustomHeaders<Map<String, String>>(
    .systemConfig,
    'network.customHeaders',
    {},
    _MapCodec(_PrimitiveCodec.string, _PrimitiveCodec.string),
  ),

  // Album
  albumSortMode<AlbumSortMode>(
    .appConfig,
    'album.sortMode',
    AlbumSortMode.mostRecent,
    _EnumCodec(AlbumSortMode.values),
  ),
  albumIsReverse<bool>(.appConfig, 'album.isReverse', true),
  albumIsGrid<bool>(.appConfig, 'album.isGrid', false),

  // Timeline
  timelineTilesPerRow<int>(.appConfig, 'timeline.tilesPerRow', 4),
  timelineGroupAssetsBy<GroupAssetsBy>(
    .appConfig,
    'timeline.groupAssetsBy',
    GroupAssetsBy.day,
    _EnumCodec(GroupAssetsBy.values),
  ),
  timelineStorageIndicator<bool>(.appConfig, 'timeline.storageIndicator', true),

  // Log
  logLevel<LogLevel>(.systemConfig, 'log.level', .info, _EnumCodec(LogLevel.values)),

  // Map
  mapShowFavoriteOnly<bool>(.appConfig, 'map.showFavoriteOnly', false),
  mapRelativeDate<int>(.appConfig, 'map.relativeDate', 0),
  mapIncludeArchived<bool>(.appConfig, 'map.includeArchived', false),
  mapThemeMode<ThemeMode>(.appConfig, 'map.themeMode', .system, _EnumCodec(ThemeMode.values)),
  mapWithPartners<bool>(.appConfig, 'map.withPartners', false),

  // Cleanup
  cleanupKeepFavorites<bool>(.appConfig, 'cleanup.keepFavorites', true),
  cleanupKeepMediaType<AssetKeepType>(
    .appConfig,
    'cleanup.keepMediaType',
    AssetKeepType.none,
    _EnumCodec(AssetKeepType.values),
  ),
  cleanupKeepAlbumIds<List<String>>(.appConfig, 'cleanup.keepAlbumIds', [], _ListCodec(_PrimitiveCodec.string)),
  cleanupCutoffDaysAgo<int>(.appConfig, 'cleanup.cutoffDaysAgo', -1),
  cleanupDefaultsInitialized<bool>(.appConfig, 'cleanup.defaultsInitialized', false),

  // Slideshow
  slideshowTransition<bool>(.appConfig, 'slideshow.transition', true),
  slideshowRepeat<bool>(.appConfig, 'slideshow.repeat', true),
  slideshowDuration<int>(.appConfig, 'slideshow.duration', 5),
  slideshowLook<SlideshowLook>(.appConfig, 'slideshow.look', SlideshowLook.contain, _EnumCodec(SlideshowLook.values)),
  slideshowDirection<SlideshowDirection>(
    .appConfig,
    'slideshow.direction',
    SlideshowDirection.forward,
    _EnumCodec(SlideshowDirection.values),
  );

  final MetadataDomain domain;
  final String name;
  final T defaultValue;
  final _MetadataCodec<T>? _codecOverride;

  const MetadataKey(this.domain, this.name, this.defaultValue, [this._codecOverride]);

  String get key => '${domain.prefix}.$name';

  _MetadataCodec<T> get _codec => _codecOverride ?? _MetadataCodec.forPrimitive(defaultValue);

  String encode(T value) => _codec.encode(value);

  T decode(String raw) => _codec.decode(raw) ?? defaultValue;

  static Map<String, MetadataKey<Object>> asKeyMap() => {for (var value in MetadataKey.values) value.key: value};
}

sealed class _MetadataCodec<T extends Object> {
  const _MetadataCodec();

  String encode(T value);
  T? decode(String raw);

  static const Map<Type, _MetadataCodec<Object>> _primitives = {
    int: _PrimitiveCodec.integer,
    double: _PrimitiveCodec.real,
    bool: _PrimitiveCodec.boolean,
    String: _PrimitiveCodec.string,
    DateTime: _DateTimeCodec(),
  };

  static _MetadataCodec<T> forPrimitive<T extends Object>(T sample) {
    final codec = _primitives[sample.runtimeType];
    if (codec == null) {
      throw StateError(
        'No primitive codec for ${sample.runtimeType}. Provide an explicit codec when defining the MetadataKey.',
      );
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
  T? decode(String raw) => values.firstWhereOrNull((v) => v.name == raw);
}

final class _DateTimeCodec extends _MetadataCodec<DateTime> {
  const _DateTimeCodec();

  @override
  String encode(DateTime value) => value.toIso8601String();

  @override
  DateTime? decode(String raw) => DateTime.tryParse(raw);
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
  Map<K, V>? decode(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return null;
      }
      final result = <K, V>{};
      for (final entry in decoded.entries) {
        final rawKey = entry.key;
        final rawValue = entry.value;
        if (rawKey is! String || rawValue is! String) {
          return null;
        }
        final k = _keyCodec.decode(rawKey);
        final v = _valueCodec.decode(rawValue);
        if (k == null || v == null) {
          return null;
        }
        result[k] = v;
      }
      return result;
    } on FormatException {
      return null;
    }
  }
}

final class _ListCodec<T extends Object> extends _MetadataCodec<List<T>> {
  final _MetadataCodec<T> _elementCodec;

  const _ListCodec(this._elementCodec);

  @override
  String encode(List<T> value) => jsonEncode(value.map(_elementCodec.encode).toList());

  @override
  List<T>? decode(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) {
        return null;
      }
      final result = <T>[];
      for (final item in decoded) {
        if (item is! String) {
          return null;
        }
        final element = _elementCodec.decode(item);
        if (element == null) {
          return null;
        }
        result.add(element);
      }
      return result;
    } on FormatException {
      return null;
    }
  }
}

final class _PrimitiveCodec<T extends Object> extends _MetadataCodec<T> {
  final T? Function(String) _parse;

  const _PrimitiveCodec._(this._parse);

  @override
  String encode(T value) => value.toString();

  @override
  T? decode(String raw) => _parse(raw);

  static const integer = _PrimitiveCodec<int>._(int.tryParse);
  static const real = _PrimitiveCodec<double>._(double.tryParse);
  static const boolean = _PrimitiveCodec<bool>._(bool.tryParse);
  static const string = _PrimitiveCodec<String>._(_identity);

  static String? _identity(String s) => s;
}
