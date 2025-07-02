# Multi-Face Search Feature Documentation

## Overview

This feature allows users to search for photos by selecting multiple faces/people, similar to Google Photos functionality. Users can choose different search behaviors when multiple people are selected:

1. **All People (AND)** - Shows photos containing ALL selected people
2. **Any People (OR)** - Shows photos containing ANY of the selected people
3. **Only Them (ONLY)** - Shows photos containing ONLY the selected people and no others

## User Interface

### People Selection

- **+ Button**: Added next to the "PEOPLE" label for easy access to add more faces
- **Selected People Display**: Shows currently selected people with individual remove buttons
- **Behavior Toggle**: Appears when 2+ people are selected, allowing users to choose search behavior
- **Three Options**:
  - "All People" - finds photos where all selected people appear together
  - "Any People" - finds photos containing any of the selected people
  - "Only Them" - finds photos containing only the selected people (no other people)

### UI Improvements

- Selected people are displayed as chips with thumbnails and remove buttons
- Better visual hierarchy with the + button for adding people
- Responsive behavior selection with clear visual feedback
- Search count indicator showing how many people are selected

## Technical Implementation

### Backend Changes

#### 1. New PersonSearchBehavior Enum

```typescript
export enum PersonSearchBehavior {
  AND = "and",
  OR = "or",
  ONLY = "only",
}
```

#### 2. Updated Search DTOs

- Replaced `personIdsAndBehavior?: boolean` with `personSearchBehavior?: PersonSearchBehavior`
- Backward compatibility maintained through migration logic

#### 3. Database Query Logic

**AND Behavior (Default)**:

```sql
-- Find assets containing ALL specified people
SELECT DISTINCT assetId FROM asset_faces
WHERE personId IN (selected_person_ids) AND deletedAt IS NULL
GROUP BY assetId
HAVING COUNT(DISTINCT personId) = number_of_selected_people
```

**OR Behavior**:

```sql
-- Find assets containing ANY of the specified people
SELECT DISTINCT assetId FROM asset_faces
WHERE personId IN (selected_person_ids) AND deletedAt IS NULL
```

**ONLY Behavior**:

```sql
-- Find assets containing ONLY the specified people (no others)
SELECT assetId FROM asset_faces
WHERE deletedAt IS NULL
GROUP BY assetId
HAVING COUNT(CASE WHEN personId IN (selected_person_ids) THEN personId END) = number_of_selected_people
AND COUNT(DISTINCT personId) = number_of_selected_people
```

### Frontend Changes

#### 1. SearchFilterModal Updates

- Updated `SearchFilter` type to use `personSearchBehavior: 'and' | 'or' | 'only'`
- Modified payload generation to include behavior parameter
- Maintained backward compatibility

#### 2. SearchPeopleSection Enhancements

```typescript
interface Props {
  selectedPeople: SvelteSet<string>;
  personSearchBehavior?: "and" | "or" | "only";
}
```

**Key Features:**

- Three-option behavior selector
- Selected people chips with remove functionality
- - button for adding people
- Responsive UI that adapts to selection count

### Translation Keys Added

- `add_people`: "Add people"
- `only_people`: "Only them"
- `selected_people`: "Selected people"
- `remove_person`: "Remove person"

## Use Cases

### 1. Family Photos (AND Behavior)

**Scenario**: Find photos where both parents appear together

- Select: Mom, Dad
- Behavior: "All People"
- Result: Photos containing both Mom AND Dad

### 2. Group Events (OR Behavior)

**Scenario**: Find all photos from a party with any family members

- Select: Mom, Dad, Sister, Brother
- Behavior: "Any People"
- Result: Photos containing Mom OR Dad OR Sister OR Brother

### 3. Intimate Moments (ONLY Behavior)

**Scenario**: Find photos with just the couple, no other people

- Select: Wife, Husband
- Behavior: "Only Them"
- Result: Photos containing ONLY Wife and Husband (no other people present)

## API Parameters

### Search Request

```typescript
{
  personIds: string[];           // Array of person IDs
  personSearchBehavior?: 'and' | 'or' | 'only'; // Search behavior
  // ... other search parameters
}
```

### Examples

```typescript
// Find photos with all selected people
{
  personIds: ['person1', 'person2'],
  personSearchBehavior: 'and'
}

// Find photos with any selected people
{
  personIds: ['person1', 'person2', 'person3'],
  personSearchBehavior: 'or'
}

// Find photos with only selected people
{
  personIds: ['person1', 'person2'],
  personSearchBehavior: 'only'
}
```

## Backward Compatibility

The implementation maintains full backward compatibility:

- Default behavior is 'and' (same as previous `personIdsAndBehavior: true`)
- Single person searches work unchanged
- Existing API calls continue to function

## Performance Considerations

### Database Optimization

- Uses efficient JOIN operations with GROUP BY and HAVING clauses
- Leverages existing indexes on `asset_faces` table
- ONLY behavior has slightly higher complexity but is optimized for typical use cases

### Frontend Performance

- Lazy loading of people list
- Efficient state management with SvelteSet
- Minimal re-renders through reactive patterns

## Testing

### Test Scenarios

1. **Single Person**: Verify unchanged behavior
2. **Multiple People - AND**: Verify all people appear in results
3. **Multiple People - OR**: Verify any people appear in results
4. **Multiple People - ONLY**: Verify only selected people appear (no others)
5. **Edge Cases**: Empty selections, invalid person IDs, deleted faces

### Database Test Queries

```sql
-- Test data setup
INSERT INTO asset_faces (id, assetId, personId, ...) VALUES
('face1', 'asset1', 'person1', ...),  -- Asset1: Person1
('face2', 'asset1', 'person2', ...),  -- Asset1: Person2
('face3', 'asset2', 'person1', ...),  -- Asset2: Person1
('face4', 'asset2', 'person3', ...),  -- Asset2: Person3
('face5', 'asset3', 'person1', ...),  -- Asset3: Person1
('face6', 'asset3', 'person2', ...),  -- Asset3: Person2
('face7', 'asset3', 'person3', ...);  -- Asset3: Person3

-- Test AND behavior (Person1 AND Person2)
-- Expected: asset1, asset3
SELECT * FROM search_assets WHERE personIds=['person1','person2'] AND behavior='and';

-- Test OR behavior (Person1 OR Person2)
-- Expected: asset1, asset2, asset3
SELECT * FROM search_assets WHERE personIds=['person1','person2'] AND behavior='or';

-- Test ONLY behavior (Person1 AND Person2 ONLY)
-- Expected: asset1 (asset3 excluded because it also has person3)
SELECT * FROM search_assets WHERE personIds=['person1','person2'] AND behavior='only';
```

## Future Enhancements

### Possible Improvements

1. **Advanced Filters**: Combine face selection with date ranges, locations
2. **Face Confidence**: Filter by face detection confidence scores
3. **Bulk Operations**: Apply tags or organize photos based on face selections
4. **Smart Suggestions**: Suggest related people based on frequent co-appearances
5. **Performance**: Caching strategies for frequent face queries

### Mobile Considerations

- Touch-friendly interface for face selection
- Swipe gestures for quick behavior switching
- Offline caching of frequently selected people

## Migration Guide

### For Existing Users

No action required - the feature is fully backward compatible.

### For Developers

If you're using the search API programmatically:

```typescript
// Old way (still works)
const searchOld = {
  personIds: ["person1", "person2"],
  personIdsAndBehavior: true, // Maps to 'and'
};

// New way (recommended)
const searchNew = {
  personIds: ["person1", "person2"],
  personSearchBehavior: "and", // More explicit
};
```

## Conclusion

The multi-face search feature significantly enhances Immich's people search capabilities by providing Google Photos-like functionality with three distinct search behaviors. The implementation prioritizes user experience, performance, and backward compatibility while laying the groundwork for future enhancements.
