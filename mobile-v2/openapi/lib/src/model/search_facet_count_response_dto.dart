//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_facet_count_response_dto.g.dart';

/// SearchFacetCountResponseDto
///
/// Properties:
/// * [count] 
/// * [value] 
@BuiltValue()
abstract class SearchFacetCountResponseDto implements Built<SearchFacetCountResponseDto, SearchFacetCountResponseDtoBuilder> {
  @BuiltValueField(wireName: r'count')
  int get count;

  @BuiltValueField(wireName: r'value')
  String get value;

  SearchFacetCountResponseDto._();

  factory SearchFacetCountResponseDto([void updates(SearchFacetCountResponseDtoBuilder b)]) = _$SearchFacetCountResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchFacetCountResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchFacetCountResponseDto> get serializer => _$SearchFacetCountResponseDtoSerializer();
}

class _$SearchFacetCountResponseDtoSerializer implements PrimitiveSerializer<SearchFacetCountResponseDto> {
  @override
  final Iterable<Type> types = const [SearchFacetCountResponseDto, _$SearchFacetCountResponseDto];

  @override
  final String wireName = r'SearchFacetCountResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchFacetCountResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'count';
    yield serializers.serialize(
      object.count,
      specifiedType: const FullType(int),
    );
    yield r'value';
    yield serializers.serialize(
      object.value,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchFacetCountResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SearchFacetCountResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'count':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.count = valueDes;
          break;
        case r'value':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.value = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchFacetCountResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchFacetCountResponseDtoBuilder();
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

