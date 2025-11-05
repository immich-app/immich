# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ pnpm install
```

### Local Development

```
$ pnpm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.


### Automatic Stack Candidates (Experimental)

An optional experimental feature generates suggested photo stack candidates based on rapid-capture temporal windows and filename numeric sequences (e.g. burst shots). Enable it in the admin UI (System Config -> Server -> autoStack.enabled) or via the configuration file under:

```yaml
server:
	autoStack:
		enabled: true
		windowSeconds: 5
		maxGapSeconds: 5
		minGroupSize: 2
		horizonMinutes: 10
		cameraMatch: true
			maxCandidates: 200
			autoPromoteMinScore: 95
```

API endpoints (authenticated):
- `GET /api/auto-stack/candidates` – list active candidates ordered by score then recency. Each item returns: `id`, `count`, `score (0-100)`, and `assets[{ assetId, position }]`.
- `GET /api/auto-stack/candidates/score-stats` – histogram of current candidate scores and a recommended autoPromoteMinScore threshold.
- `POST /api/auto-stack/candidates/:id/promote` – create a real stack from the candidate (optionally set primaryAssetId in body).
- `DELETE /api/auto-stack/candidates/:id` – dismiss a candidate; it will not reappear.

Metrics (Prometheus counters):
- `immich.auto_stack.candidates_created`
- `immich.auto_stack.candidates_promoted`
- `immich.auto_stack.candidates_dismissed`
- `immich.auto_stack.candidates_auto_promoted`
- `immich.auto_stack.candidates_pruned`

Flag off: endpoints return empty / disabled state and no new candidates are generated.
### Build

```
$ pnpm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true pnpm run deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> pnpm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
