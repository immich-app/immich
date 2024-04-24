//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'download_archive_info.g.dart';

/// DownloadArchiveInfo
///
/// Properties:
/// * [assetIds] 
/// * [size] 
@BuiltValue()
abstract class DownloadArchiveInfo implements Built<DownloadArchiveInfo, DownloadArchiveInfoBuilder> {
  @BuiltValueField(wireName: r'assetIds')
  BuiltList<String> get assetIds;

  @BuiltValueField(wireName: r'size')
  int get size;

  DownloadArchiveInfo._();

  factory DownloadArchiveInfo([void updates(DownloadArchiveInfoBuilder b)]) = _$DownloadArchiveInfo;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DownloadArchiveInfoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DownloadArchiveInfo> get serializer => _$DownloadArchiveInfoSerializer();
}

class _$DownloadArchiveInfoSerializer implements PrimitiveSerializer<DownloadArchiveInfo> {
  @override
  final Iterable<Type> types = const [DownloadArchiveInfo, _$DownloadArchiveInfo];

  @override
  final String wireName = r'DownloadArchiveInfo';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DownloadArchiveInfo object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assetIds';
    yield serializers.serialize(
      object.assetIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'size';
    yield serializers.serialize(
      object.size,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DownloadArchiveInfo object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DownloadArchiveInfoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assetIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.assetIds.replace(valueDes);
          break;
        case r'size':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.size = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DownloadArchiveInfo deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DownloadArchiveInfoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

