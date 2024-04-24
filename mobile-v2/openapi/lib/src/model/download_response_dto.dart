//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/download_archive_info.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'download_response_dto.g.dart';

/// DownloadResponseDto
///
/// Properties:
/// * [archives] 
/// * [totalSize] 
@BuiltValue()
abstract class DownloadResponseDto implements Built<DownloadResponseDto, DownloadResponseDtoBuilder> {
  @BuiltValueField(wireName: r'archives')
  BuiltList<DownloadArchiveInfo> get archives;

  @BuiltValueField(wireName: r'totalSize')
  int get totalSize;

  DownloadResponseDto._();

  factory DownloadResponseDto([void updates(DownloadResponseDtoBuilder b)]) = _$DownloadResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DownloadResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DownloadResponseDto> get serializer => _$DownloadResponseDtoSerializer();
}

class _$DownloadResponseDtoSerializer implements PrimitiveSerializer<DownloadResponseDto> {
  @override
  final Iterable<Type> types = const [DownloadResponseDto, _$DownloadResponseDto];

  @override
  final String wireName = r'DownloadResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DownloadResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'archives';
    yield serializers.serialize(
      object.archives,
      specifiedType: const FullType(BuiltList, [FullType(DownloadArchiveInfo)]),
    );
    yield r'totalSize';
    yield serializers.serialize(
      object.totalSize,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DownloadResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DownloadResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'archives':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DownloadArchiveInfo)]),
          ) as BuiltList<DownloadArchiveInfo>;
          result.archives.replace(valueDes);
          break;
        case r'totalSize':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.totalSize = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DownloadResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DownloadResponseDtoBuilder();
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

