# Immich Apprentissage machine

- Classification d'images
- Embarquement de CLIP
- Reconnaissance faciale

# Mise en place

Ce projet utilise [Poetry](https://python-poetry.org/docs/#installation), donc soyez certain de l'installer en premier.
Exécuter `poetry install --no-root --with dev` installera tout ce dont vous avez besoin dans un environnement virtuel isolé.

Pour ajouter ou supprimer des dépendances, vous pouvez utiliser les commandes `poetry add $PACKAGE_NAME` et `poetry remove $PACKAGE_NAME` respectivement.
Soyez sûr de commit les fichiers `poetry.lock` et `pyproject.toml` pour refléter les changements de dépendances.


# Test de charge

Pour mesurer le débit d'inférence et la latence, vous pouvez utiliser [Locust](https://locust.io/) avec le fichier fourni `locustfile.py`.
Locust fonctionne en interrogeant les endpoints des modèles et en aggrégeant leurs statistiques, signifiant que l'application doit être déployée.
Vous pouvez exécuter `load_test.sh` pour automatiquement déployer l'application localement et démarrer Locust, en ajustant si besoin ses variables d'environnement.

En alternative, pour réaliser plus de tests customisés, vous pourriez aussi exécuter `locust` directement : voir la [documentation](https://docs.locust.io/en/stable/index.html). Notez que dans le jargon de Locust, la concurrence est mesurée en `users` et que chaque user exécute une tâche après l'autre. Pour parvenir à une concurrence par endpoint, multipliez ce nombre par le nombre d'endpoints à interroger. Par exemple, s'il y a 3 endpoints et que vous voulez que chacun d'entre eux reçoive 8 requêtes à la fois, vous devrez mettre ce nombre d'users à 24.
