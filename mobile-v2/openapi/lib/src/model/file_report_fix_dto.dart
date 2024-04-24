//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/file_report_item_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'file_report_fix_dto.g.dart';

/// FileReportFixDto
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class FileReportFixDto implements Built<FileReportFixDto, FileReportFixDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<FileReportItemDto> get items;

  FileReportFixDto._();

  factory FileReportFixDto([void updates(FileReportFixDtoBuilder b)]) = _$FileReportFixDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FileReportFixDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FileReportFixDto> get serializer => _$FileReportFixDtoSerializer();
}

class _$FileReportFixDtoSerializer implements PrimitiveSerializer<FileReportFixDto> {
  @override
  final Iterable<Type> types = const [FileReportFixDto, _$FileReportFixDto];

  @override
  final String wireName = r'FileReportFixDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FileReportFixDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(FileReportItemDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FileReportFixDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FileReportFixDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(FileReportItemDto)]),
          ) as BuiltList<FileReportItemDto>;
          result.items.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FileReportFixDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FileReportFixDtoBuilder();
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

