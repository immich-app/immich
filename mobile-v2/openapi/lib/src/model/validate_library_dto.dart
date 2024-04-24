//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'validate_library_dto.g.dart';

/// ValidateLibraryDto
///
/// Properties:
/// * [exclusionPatterns] 
/// * [importPaths] 
@BuiltValue()
abstract class ValidateLibraryDto implements Built<ValidateLibraryDto, ValidateLibraryDtoBuilder> {
  @BuiltValueField(wireName: r'exclusionPatterns')
  BuiltList<String>? get exclusionPatterns;

  @BuiltValueField(wireName: r'importPaths')
  BuiltList<String>? get importPaths;

  ValidateLibraryDto._();

  factory ValidateLibraryDto([void updates(ValidateLibraryDtoBuilder b)]) = _$ValidateLibraryDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ValidateLibraryDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ValidateLibraryDto> get serializer => _$ValidateLibraryDtoSerializer();
}

class _$ValidateLibraryDtoSerializer implements PrimitiveSerializer<ValidateLibraryDto> {
  @override
  final Iterable<Type> types = const [ValidateLibraryDto, _$ValidateLibraryDto];

  @override
  final String wireName = r'ValidateLibraryDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ValidateLibraryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.exclusionPatterns != null) {
      yield r'exclusionPatterns';
      yield serializers.serialize(
        object.exclusionPatterns,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.importPaths != null) {
      yield r'importPaths';
      yield serializers.serialize(
        object.importPaths,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ValidateLibraryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ValidateLibraryDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'exclusionPatterns':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.exclusionPatterns.replace(valueDes);
          break;
        case r'importPaths':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
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
  ValidateLibraryDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ValidateLibraryDtoBuilder();
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

