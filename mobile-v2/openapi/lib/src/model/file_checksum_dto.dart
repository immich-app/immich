//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'file_checksum_dto.g.dart';

/// FileChecksumDto
///
/// Properties:
/// * [filenames] 
@BuiltValue()
abstract class FileChecksumDto implements Built<FileChecksumDto, FileChecksumDtoBuilder> {
  @BuiltValueField(wireName: r'filenames')
  BuiltList<String> get filenames;

  FileChecksumDto._();

  factory FileChecksumDto([void updates(FileChecksumDtoBuilder b)]) = _$FileChecksumDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FileChecksumDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FileChecksumDto> get serializer => _$FileChecksumDtoSerializer();
}

class _$FileChecksumDtoSerializer implements PrimitiveSerializer<FileChecksumDto> {
  @override
  final Iterable<Type> types = const [FileChecksumDto, _$FileChecksumDto];

  @override
  final String wireName = r'FileChecksumDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FileChecksumDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'filenames';
    yield serializers.serialize(
      object.filenames,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FileChecksumDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FileChecksumDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'filenames':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.filenames.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FileChecksumDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FileChecksumDtoBuilder();
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

