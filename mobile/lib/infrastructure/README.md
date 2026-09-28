# Infrastructure Layer

This directory contains the infrastructure layer of Immich. The infrastructure layer is responsible for the implementation details of the app. It includes data sources, APIs, and other external dependencies.

## Structure

- **[Repositories](./repositories/)**: These are the actual implementation of the domain interfaces. A single interface might have multiple implementations.
- **[Utils](./utils/)**: These are utility classes and functions specific to infrastructure implementations.

```
infrastructure/
├── repositories/
│   └── user.repository.dart
└── utils/
    └── user.converter.dart
```

> **Note:** The Drift schema, the database class, and the server API base moved to
> [`lib/data/`](../data/README.md). Repositories here are migrating there one entity at a
> time; new data access should be added under `lib/data/`.

## Usage

The infrastructure layer provides concrete implementations of repository interfaces defined in the domain layer. These implementations are exposed through Riverpod providers in the root `providers` directory.

```dart
// In domain/services/user.service.dart
final userRepository = ref.watch(userRepositoryProvider);
final user = await userRepository.getUser(userId);
```

The domain layer should never directly instantiate repository implementations, but instead receive them through dependency injection.