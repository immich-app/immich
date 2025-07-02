# 🔍 Multi-Face Search Feature for Immich

A comprehensive enhancement to Immich that provides Google Photos-like functionality for searching photos by multiple faces with flexible search behaviors.

## 🌟 Features

### Three Search Behaviors

- **🔗 All People (AND)**: Find photos containing ALL selected people together
- **🔄 Any People (OR)**: Find photos containing ANY of the selected people
- **👥 Only Them (ONLY)**: Find photos containing ONLY the selected people (no others)

### Enhanced UI

- **➕ Add People Button**: Easy access to add more faces to search
- **🏷️ Selected People Chips**: Visual display of selected people with individual remove buttons
- **🎛️ Three-Option Toggle**: Intuitive behavior selection when multiple people are selected
- **📱 Responsive Design**: Works seamlessly on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git repository cloned locally
- 4-6GB available disk space

### One-Command Deployment

```bash
# Deploy production environment
./deploy-multi-face.sh deploy-prod

# Or deploy development environment
./deploy-multi-face.sh deploy-dev
```

### Manual Deployment

```bash
# 1. Build Docker images
docker build -t immich-server:multi-face -f server/Dockerfile .
docker build -t immich-machine-learning:multi-face machine-learning/

# 2. Deploy with Docker Compose
docker-compose -f docker-compose-multi-face.yml up -d
```

## 📋 Files Overview

### Core Implementation

- `server/src/dtos/search.dto.ts` - Backend API definitions with PersonSearchBehavior enum
- `server/src/utils/database.ts` - Database query logic for all three search behaviors
- `server/src/repositories/search.repository.ts` - Search repository interface updates
- `web/src/lib/modals/SearchFilterModal.svelte` - Search filter modal with behavior selection
- `web/src/lib/components/shared-components/search-bar/search-people-section.svelte` - Enhanced people selection UI

### Deployment & Testing

- `deploy-multi-face.sh` - Automated deployment script
- `docker-compose-multi-face.yml` - Custom Docker Compose configuration
- `test-multi-face-search.sh` - Comprehensive testing suite
- `BUILD_AND_DEPLOY.md` - Detailed build and deployment guide

### Documentation

- `MULTI_FACE_SEARCH_FEATURE.md` - Technical implementation documentation
- `README-MULTI-FACE-SEARCH.md` - This file

### Configuration

- `.env` - Environment configuration (auto-generated)
- `i18n/en.json` - Updated with new translation keys

## 🔧 Technical Implementation

### Backend Changes

#### PersonSearchBehavior Enum

```typescript
export enum PersonSearchBehavior {
  AND = "and", // All people must be present
  OR = "or", // Any people can be present
  ONLY = "only", // Only selected people, no others
}
```

#### Database Query Logic

- **AND Behavior**: Uses `GROUP BY` and `HAVING COUNT(DISTINCT personId) = personIds.length`
- **OR Behavior**: Simple `WHERE personId IN (personIds)` clause
- **ONLY Behavior**: Complex subquery ensuring no other people are present

#### API Parameter

```json
{
  "personIds": ["person1-id", "person2-id"],
  "personSearchBehavior": "only"
}
```

### Frontend Changes

#### Enhanced People Selection UI

- Three-button toggle for behavior selection
- Selected people display as removable chips
- Add button (+) for easy face addition
- Progressive enhancement (only shows when relevant)

#### Search Filter Integration

```typescript
export type SearchFilter = {
  // ... existing fields ...
  personSearchBehavior: "and" | "or" | "only";
};
```

## 🧪 Testing

### Automated Testing

```bash
# Run comprehensive test suite
./test-multi-face-search.sh

# Run with custom API URL
./test-multi-face-search.sh --api-url http://your-server:2283

# Show only manual testing instructions
./test-multi-face-search.sh --manual
```

### Manual Testing

1. Open http://localhost:2283
2. Navigate to Search → People
3. Select 2+ people
4. Verify three-option toggle appears
5. Test each behavior with known photo sets

## 📊 Use Cases

### Family Photography

- **All People**: "Photos of mom, dad, and kids together"
- **Any People**: "Photos containing any family member"
- **Only Them**: "Photos of just mom and dad (no kids)"

### Event Photography

- **All People**: "Group photos with all the key people"
- **Any People**: "Anyone from the event"
- **Only Them**: "Private moments between specific people"

### Professional Photography

- **All People**: "Team photos with all members"
- **Any People**: "Photos featuring any team member"
- **Only Them**: "Executive portraits (no other staff)"

## 🔍 API Examples

### All People Search (AND)

```bash
curl -X POST http://localhost:2283/api/search/metadata \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "personIds": ["mom-id", "dad-id", "child-id"],
    "personSearchBehavior": "and"
  }'
```

### Any People Search (OR)

```bash
curl -X POST http://localhost:2283/api/search/metadata \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "personIds": ["friend1-id", "friend2-id", "friend3-id"],
    "personSearchBehavior": "or"
  }'
```

### Only Them Search (ONLY)

```bash
curl -X POST http://localhost:2283/api/search/metadata \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "personIds": ["spouse1-id", "spouse2-id"],
    "personSearchBehavior": "only"
  }'
```

## 🐛 Troubleshooting

### Common Issues

#### Docker Sign-in Required

```bash
# Switch to default context
docker context use default

# Or use legacy builder
DOCKER_BUILDKIT=0 docker build -t immich-server:multi-face -f server/Dockerfile .
```

#### Build Failures

```bash
# Clear Docker cache
docker builder prune -af

# Build with no cache
docker build --no-cache -t immich-server:multi-face -f server/Dockerfile .
```

#### Service Not Starting

```bash
# Check logs
docker-compose -f docker-compose-multi-face.yml logs -f

# Restart services
docker-compose -f docker-compose-multi-face.yml restart
```

#### Feature Not Working

```bash
# Run test suite
./test-multi-face-search.sh

# Check server logs for PersonSearchBehavior
docker logs immich_server_multi_face | grep PersonSearchBehavior
```

## 📈 Performance

### Database Impact

- **Optimized Queries**: Leverages existing indexes on `asset_faces` table
- **Minimal Overhead**: AND/OR behaviors use simple queries
- **ONLY Behavior**: More complex but optimized with proper subqueries

### Memory Usage

- **No Additional Memory**: Feature uses existing data structures
- **Efficient Processing**: Queries processed at database level

### Network Traffic

- **Minimal Impact**: Only adds one optional parameter to existing API calls
- **Backward Compatible**: Existing clients continue to work unchanged

## 🔮 Future Enhancements

### Planned Features

- **Face Exclusion**: "Find photos with Person A but NOT Person B"
- **Relationship Searches**: "Photos of parents with at least one child"
- **Time-based Combinations**: "Family photos from last vacation"
- **Smart Suggestions**: "People often photographed together"

### UI Improvements

- **Bulk Selection**: Select multiple people at once
- **Recent Searches**: Remember common search patterns
- **Visual Indicators**: Show search behavior in results
- **Keyboard Shortcuts**: Quick behavior switching

## 🤝 Contributing

### Code Structure

- Follow existing Immich patterns and conventions
- Add comprehensive tests for new features
- Update documentation for any API changes
- Consider backward compatibility in all changes

### Testing New Features

- Run automated test suite: `./test-multi-face-search.sh`
- Test manually with various photo combinations
- Verify performance with large datasets
- Check mobile responsiveness

## 📄 License

This feature follows the same license as the main Immich project.

## 🙏 Acknowledgments

- **Immich Team**: For creating an amazing self-hosted photo management solution
- **Google Photos**: For inspiration on multi-face search functionality
- **Open Source Community**: For continuous feedback and contributions

---

## 📞 Support

For issues with the multi-face search feature:

1. **Check Logs**: `docker logs immich_server_multi_face`
2. **Run Tests**: `./test-multi-face-search.sh`
3. **Verify API**: Test endpoints manually with curl
4. **Review Documentation**: Check `MULTI_FACE_SEARCH_FEATURE.md` for technical details

### Getting Help

- 📖 **Documentation**: Review `BUILD_AND_DEPLOY.md` for detailed setup
- 🧪 **Testing**: Use `test-multi-face-search.sh` for diagnostics
- 🔧 **Configuration**: Check `.env` file and Docker Compose settings
- 📱 **UI Issues**: Test with multiple browsers and devices

---

**Happy searching! 🎉**
