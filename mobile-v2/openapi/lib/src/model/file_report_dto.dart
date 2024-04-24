//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/file_report_item_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'file_report_dto.g.dart';

/// FileReportDto
///
/// Properties:
/// * [extras] 
/// * [orphans] 
@BuiltValue()
abstract class FileReportDto implements Built<FileReportDto, FileReportDtoBuilder> {
  @BuiltValueField(wireName: r'extras')
  BuiltList<String> get extras;

  @BuiltValueField(wireName: r'orphans')
  BuiltList<FileReportItemDto> get orphans;

  FileReportDto._();

  factory FileReportDto([void updates(FileReportDtoBuilder b)]) = _$FileReportDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FileReportDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FileReportDto> get serializer => _$FileReportDtoSerializer();
}

class _$FileReportDtoSerializer implements PrimitiveSerializer<FileReportDto> {
  @override
  final Iterable<Type> types = const [FileReportDto, _$FileReportDto];

  @override
  final String wireName = r'FileReportDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FileReportDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'extras';
    yield serializers.serialize(
      object.extras,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'orphans';
    yield serializers.serialize(
      object.orphans,
      specifiedType: const FullType(BuiltList, [FullType(FileReportItemDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FileReportDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FileReportDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'extras':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.extras.replace(valueDes);
          break;
        case r'orphans':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(FileReportItemDto)]),
          ) as BuiltList<FileReportItemDto>;
          result.orphans.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FileReportDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FileReportDtoBuilder();
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

