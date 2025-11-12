# Testing semantic video segment search on macOS

This guide walks through validating the video-segmentation pipeline that powers `/api/search/video-segments` by running the full Immich stack locally on macOS. The flow covers starting the development containers, uploading a sample movie, forcing the new segmentation job to run, and issuing a natural-language query against the freshly indexed segments.

## Prerequisites

- macOS 13 (Ventura) or later with at least 16 GB RAM and 40 GB of free disk space for Docker images, the PostgreSQL volume, and uploaded media.
- [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop) with virtualization enabled in macOS settings.
- Xcode command-line tools (`xcode-select --install`) so the `make` utility is available.
- A video file (for example, a short movie or trailer) that is at least a few minutes long to produce multiple segments.

> The development stack runs the machine-learning service in CPU mode by default. No dedicated GPU is required, but first-time model downloads may take several minutes.

## Prepare the repository

1. Clone your fork or working copy and enter the project directory.

   ```bash
   git clone https://github.com/immich-app/immich.git
   cd immich
   ```

2. Copy the sample environment file that Docker Compose expects and edit the required paths.

   ```bash
   cp docker/example.env docker/.env
   open docker/.env
   ```

   At a minimum, point `UPLOAD_LOCATION` and `DB_DATA_LOCATION` to writable directories on your Mac. Create the directories if they do not already exist, for example:

   ```bash
   mkdir -p ~/immich-dev/uploads ~/immich-dev/database
   ```

3. (Optional) If you intend to reuse existing assets, place them inside the directory referenced by `UPLOAD_LOCATION` before starting the stack.

## Launch the development stack

1. Start all services (server, web app, machine learning, PostgreSQL, and Redis) via the bundled `make` target. The first run builds local images, so it can take 10–15 minutes on a cold system.

   ```bash
   make dev
   ```

   Leave this terminal open; `make dev` tails container logs and keeps the services running. You can open a second terminal window for the following steps.

2. In a new terminal, run the database migrations so the new `video_segment` table is created with its vector index.

   ```bash
   docker compose -f docker/docker-compose.dev.yml exec immich-server pnpm run migrations:run
   ```

   You should see `Migration 1749000000000-AddVideoSegmentTable succeeded` in the output.

3. (Optional) Tail the backend logs while testing to watch the segmentation job progress.

   ```bash
   docker compose -f docker/docker-compose.dev.yml logs -f immich-server
   ```

## Seed data

1. Open http://localhost:3000 in a browser. Register the first user account; it automatically receives admin permissions.
2. Upload the sample video through the “Upload” button. Wait for the upload progress indicator to finish.
3. Leave the tab open; you can monitor processing from **Administration → Jobs** once the queue runs.

## Run the video-segmentation job

1. In the Immich web app, go to **Administration → Jobs**. Locate the **Video Segmentation** queue and click **Start**. Keep the page open until the status switches to “Idle.”
   - If you prefer the API, send an authenticated request:

     ```bash
     curl -X PUT \
       -H 'Content-Type: application/json' \
       -H 'x-api-key: <YOUR_ADMIN_API_KEY>' \
       -d '{"command":"start","force":false}' \
       http://localhost:2283/api/jobs/videoSegmentation
     ```

   - Use the “Profile → API Keys” page to mint the `<YOUR_ADMIN_API_KEY>` value.

2. Watch the logs. The queue will emit warnings if a video cannot be probed or segmented; otherwise it continues silently until every asset has been processed.

3. Verify that rows landed in the database:

   ```bash
   docker compose -f docker/docker-compose.dev.yml exec database psql -U ${DB_USERNAME} ${DB_DATABASE_NAME} -c "SELECT COUNT(*) FROM video_segment;"
   ```

   Replace `${DB_USERNAME}` and `${DB_DATABASE_NAME}` with the values from `docker/.env`. A count greater than zero confirms successful indexing.

## Query video segments with natural language

1. Create (or reuse) an API key from **Profile → API Keys** and copy it to your clipboard.
2. Issue a semantic search request against the new endpoint. The `size` property limits the number of results returned.

   ```bash
   curl -X POST \
     -H 'Content-Type: application/json' \
     -H 'x-api-key: <YOUR_ADMIN_API_KEY>' \
     -d '{"query":"枪战","size":10}' \
     http://localhost:2283/api/search/video-segments
   ```

3. Inspect the JSON response. Each item includes:
   - `asset`: the parent video metadata (id, file name, owner, etc.).
   - `startTime` and `endTime`: the segment boundaries in seconds.
   - `confidence`: a 0–1 score derived from cosine distance.

4. Cross-reference the `startTime`/`endTime` values in your video editor to confirm that the segments align with the search phrase.

## Troubleshooting tips

- **Machine learning service unavailable** – Ensure `immich_machine_learning` is healthy (`docker compose ... ps`) and that your Mac has enough free RAM. Restarting the container usually resolves stalled model downloads.
- **No segments returned** – Confirm the segmentation queue finished and the video is long enough to generate multiple 10-second slices. You can re-run the queue with the **Force** toggle in the Jobs page or by sending `{ "command": "start", "force": true }` to the queue endpoint.
- **Vector index errors** – If migrations fail with vector-extension errors, delete the PostgreSQL volume (`rm -rf $(grep DB_DATA_LOCATION docker/.env | cut -d= -f2)/*`) and rerun `make dev` so the container recreates the database with the required extensions.

## Shut everything down

When you are done testing, stop the stack from the terminal that is running `make dev` by pressing `Ctrl+C`. If you started additional terminals, you can also run:

```bash
docker compose -f docker/docker-compose.dev.yml down --remove-orphans
```

The media uploaded during testing stays in the directories you configured in `docker/.env`, so delete them manually if you need a clean slate.
