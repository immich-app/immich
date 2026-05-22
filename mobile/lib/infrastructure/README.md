# Infrastructure Layer

This directory contains the infrastructure layer of Immich. The infrastructure layer is responsible for the implementation details of the app. It includes data sources, APIs, and other external dependencies.

## Structure

- **[Entities](./entities/)**: These are the classes that define the database schema for the domain models.
- **[Repositories](./repositories/)**: These are the actual implementation of the domain interfaces. A single interface might have multiple implementations.
- **[Utils](./utils/)**: These are utility classes and functions specific to infrastructure implementations.

```
infrastructure/
├── entities/
│   └── user.entity.dart
├── repositories/
│   └── user.repository.dart
└── utils/
    └── database_utils.dart
```

## Usage

The infrastructure layer provides concrete implementations of repository interfaces defined in the domain layer. These implementations are exposed through Riverpod providers in the root `providers` directory.

```dart
// In domain/services/user.service.dart
final userRepository = ref.watch(userRepositoryProvider);
final user = await userRepository.getUser(userId);
```

The domain layer should never directly instantiate repository implementations, but instead receive them through dependency injection.