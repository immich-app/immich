//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/search_facet_count_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'search_facet_response_dto.g.dart';

/// SearchFacetResponseDto
///
/// Properties:
/// * [counts] 
/// * [fieldName] 
@BuiltValue()
abstract class SearchFacetResponseDto implements Built<SearchFacetResponseDto, SearchFacetResponseDtoBuilder> {
  @BuiltValueField(wireName: r'counts')
  BuiltList<SearchFacetCountResponseDto> get counts;

  @BuiltValueField(wireName: r'fieldName')
  String get fieldName;

  SearchFacetResponseDto._();

  factory SearchFacetResponseDto([void updates(SearchFacetResponseDtoBuilder b)]) = _$SearchFacetResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SearchFacetResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SearchFacetResponseDto> get serializer => _$SearchFacetResponseDtoSerializer();
}

class _$SearchFacetResponseDtoSerializer implements PrimitiveSerializer<SearchFacetResponseDto> {
  @override
  final Iterable<Type> types = const [SearchFacetResponseDto, _$SearchFacetResponseDto];

  @override
  final String wireName = r'SearchFacetResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SearchFacetResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'counts';
    yield serializers.serialize(
      object.counts,
      specifiedType: const FullType(BuiltList, [FullType(SearchFacetCountResponseDto)]),
    );
    yield r'fieldName';
    yield serializers.serialize(
      object.fieldName,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SearchFacetResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SearchFacetResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'counts':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SearchFacetCountResponseDto)]),
          ) as BuiltList<SearchFacetCountResponseDto>;
          result.counts.replace(valueDes);
          break;
        case r'fieldName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fieldName = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SearchFacetResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SearchFacetResponseDtoBuilder();
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

