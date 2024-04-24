//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/path_entity_type.dart';
import 'package:openapi/src/model/path_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'file_report_item_dto.g.dart';

/// FileReportItemDto
///
/// Properties:
/// * [checksum] 
/// * [entityId] 
/// * [entityType] 
/// * [pathType] 
/// * [pathValue] 
@BuiltValue()
abstract class FileReportItemDto implements Built<FileReportItemDto, FileReportItemDtoBuilder> {
  @BuiltValueField(wireName: r'checksum')
  String? get checksum;

  @BuiltValueField(wireName: r'entityId')
  String get entityId;

  @BuiltValueField(wireName: r'entityType')
  PathEntityType get entityType;
  // enum entityTypeEnum {  asset,  person,  user,  };

  @BuiltValueField(wireName: r'pathType')
  PathType get pathType;
  // enum pathTypeEnum {  original,  preview,  thumbnail,  encoded_video,  sidecar,  face,  profile,  };

  @BuiltValueField(wireName: r'pathValue')
  String get pathValue;

  FileReportItemDto._();

  factory FileReportItemDto([void updates(FileReportItemDtoBuilder b)]) = _$FileReportItemDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FileReportItemDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FileReportItemDto> get serializer => _$FileReportItemDtoSerializer();
}

class _$FileReportItemDtoSerializer implements PrimitiveSerializer<FileReportItemDto> {
  @override
  final Iterable<Type> types = const [FileReportItemDto, _$FileReportItemDto];

  @override
  final String wireName = r'FileReportItemDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FileReportItemDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.checksum != null) {
      yield r'checksum';
      yield serializers.serialize(
        object.checksum,
        specifiedType: const FullType(String),
      );
    }
    yield r'entityId';
    yield serializers.serialize(
      object.entityId,
      specifiedType: const FullType(String),
    );
    yield r'entityType';
    yield serializers.serialize(
      object.entityType,
      specifiedType: const FullType(PathEntityType),
    );
    yield r'pathType';
    yield serializers.serialize(
      object.pathType,
      specifiedType: const FullType(PathType),
    );
    yield r'pathValue';
    yield serializers.serialize(
      object.pathValue,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FileReportItemDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FileReportItemDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'checksum':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.checksum = valueDes;
          break;
        case r'entityId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.entityId = valueDes;
          break;
        case r'entityType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PathEntityType),
          ) as PathEntityType;
          result.entityType = valueDes;
          break;
        case r'pathType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PathType),
          ) as PathType;
          result.pathType = valueDes;
          break;
        case r'pathValue':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.pathValue = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FileReportItemDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FileReportItemDtoBuilder();
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

