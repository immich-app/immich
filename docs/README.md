# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ npm install
```

### Local Development

```
$ npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.


### Automatic Stack Candidates

AutoStack generates suggested photo stack candidates based on time proximity, filename continuity, and visual similarity. Enable it in the admin UI (System Config → Server → AutoStack) or via configuration:

```yaml
server:
	autoStack:
		enabled: true
		windowSeconds: 90
		maxGapSeconds: 30
		minGroupSize: 2
		horizonMinutes: 10
		cameraMatch: true
		maxCandidates: 200
		autoPromoteMinScore: 70
```

Endpoints (authenticated):
- GET /api/auto-stack/candidates – list active candidates ordered by score then recency. Each item returns: `id`, `count`, `score (0-100)`, and `assets[{ assetId, position }]`.
- GET /api/auto-stack/candidates/score-stats – histogram of current candidate scores and a recommended threshold.
- POST /api/auto-stack/candidates/:id/promote – create a real stack from the candidate (optionally set `{ primaryAssetId }`).
- DELETE /api/auto-stack/candidates/:id – dismiss a candidate.

Metrics (Prometheus):
- immich.auto_stack.candidates_created
- immich.auto_stack.candidates_promoted
- immich.auto_stack.candidates_dismissed
- immich.auto_stack.candidates_auto_promoted
- immich.auto_stack.candidates_pruned

Disable by setting `server.autoStack.enabled = false`.
### Build

```
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true npm run deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
