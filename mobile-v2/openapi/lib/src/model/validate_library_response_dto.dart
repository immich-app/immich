//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/validate_library_import_path_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'validate_library_response_dto.g.dart';

/// ValidateLibraryResponseDto
///
/// Properties:
/// * [importPaths] 
@BuiltValue()
abstract class ValidateLibraryResponseDto implements Built<ValidateLibraryResponseDto, ValidateLibraryResponseDtoBuilder> {
  @BuiltValueField(wireName: r'importPaths')
  BuiltList<ValidateLibraryImportPathResponseDto>? get importPaths;

  ValidateLibraryResponseDto._();

  factory ValidateLibraryResponseDto([void updates(ValidateLibraryResponseDtoBuilder b)]) = _$ValidateLibraryResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ValidateLibraryResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ValidateLibraryResponseDto> get serializer => _$ValidateLibraryResponseDtoSerializer();
}

class _$ValidateLibraryResponseDtoSerializer implements PrimitiveSerializer<ValidateLibraryResponseDto> {
  @override
  final Iterable<Type> types = const [ValidateLibraryResponseDto, _$ValidateLibraryResponseDto];

  @override
  final String wireName = r'ValidateLibraryResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ValidateLibraryResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.importPaths != null) {
      yield r'importPaths';
      yield serializers.serialize(
        object.importPaths,
        specifiedType: const FullType(BuiltList, [FullType(ValidateLibraryImportPathResponseDto)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ValidateLibraryResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ValidateLibraryResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'importPaths':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ValidateLibraryImportPathResponseDto)]),
          ) as BuiltList<ValidateLibraryImportPathResponseDto>;
          result.importPaths.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ValidateLibraryResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ValidateLibraryResponseDtoBuilder();
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

