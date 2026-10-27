// Package services holds business logic decoupled from HTTP: the background
// compression worker lives here so handlers stay thin.
package services

import (
	"context"
	"image"
	"image/jpeg"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/disintegration/imaging"

	"immich-go/config"
	"immich-go/internal/models"
	"immich-go/internal/repository"
)

// CompressionWorker downscales & re-encodes uploaded photos in the background.
//
// Design for the ODROID-C2 (Amlogic S905, 4 slow ARM cores):
//   - a fixed pool of ImageWorkers goroutines (default 2) caps CPU usage;
//   - after every processed batch the ticker sleeps cfg.WorkerCPUBudget extra,
//     yielding the core back to interactive traffic (adaptive duty cycle);
//   - runtime.GC() is called per batch so heap spikes don't accumulate;
//   - if HeapAlloc crosses cfg.MemoryLimit the worker pauses until it drops.
type CompressionWorker struct {
	repo *repository.Store
	cfg  *config.Config
}

// NewCompressionWorker builds the service.
func NewCompressionWorker(repo *repository.Store, cfg *config.Config) *CompressionWorker {
	return &CompressionWorker{repo: repo, cfg: cfg}
}

// Run loops until ctx is cancelled. Call it in its own goroutine from main.
func (w *CompressionWorker) Run(ctx context.Context) {
	ticker := time.NewTicker(w.cfg.WorkerInterval)
	defer ticker.Stop()

	log.Printf("[worker] compression loop started (interval=%s, cpuSleep=%s, workers=%d)",
		w.cfg.WorkerInterval, w.cfg.WorkerCPUBudget, w.cfg.ImageWorkers)

	for {
		select {
		case <-ctx.Done():
			log.Println("[worker] shutting down")
			return
		case <-ticker.C:
			w.processBatch(ctx)
			// Adaptive sleep: keep average CPU well under the 20% budget even
			// when there is always work pending.
			time.Sleep(w.cfg.WorkerCPUBudget)
		}
	}
}

// processBatch grabs up to 4*ImageWorkers pending images and fans them out
// over a bounded worker pool.
func (w *CompressionWorker) processBatch(ctx context.Context) {
	if w.memoryPressure() {
		log.Println("[worker] memory above limit, skipping batch")
		return
	}

	pending, err := w.repo.PendingCompressionAssets(ctx, w.cfg.ImageWorkers*4)
	if err != nil {
		log.Printf("[worker] query pending assets: %v", err)
		return
	}
	if len(pending) == 0 {
		return
	}

	sem := make(chan struct{}, w.cfg.ImageWorkers) // concurrency cap = 2
	done := make(chan struct{})
	go func() {
		for _, a := range pending {
			select {
			case <-ctx.Done():
				close(done)
				return
			case sem <- struct{}{}:
			}
			go func(a *models.Asset) {
				defer func() {
					<-sem
					if r := recover(); r != nil {
						log.Printf("[worker] panic while compressing %s: %v", a.ID, r)
					}
				}()
				w.compressOne(ctx, a)
			}(a)
		}
		for i := 0; i < cap(sem); i++ { // wait for stragglers
			sem <- struct{}{}
		}
		close(done)
	}()
	<-done

	runtime.GC() // explicit GC between batches protects the 2GB box
}

// compressOne resizes an image > MaxImageWidth to that width, re-encodes at
// JPEG quality (default 80), atomically replaces the original on disk, writes
// a thumbnail and updates file_size + resized flag in SQLite.
func (w *CompressionWorker) compressOne(ctx context.Context, a *models.Asset) {
	src, err := os.Open(a.OriginalPath)
	if err != nil {
		log.Printf("[worker] open %s: %v (marking done to avoid retry storm)", a.OriginalPath, err)
		_ = w.repo.MarkResized(ctx, a.ID, a.FileSize, "")
		return
	}
	defer src.Close()

	img, err := jpeg.Decode(src)
	if err != nil {
		// PNG/WebP/HEIC or corrupt — mark processed; originals stay untouched.
		_ = w.repo.MarkResized(ctx, a.ID, a.FileSize, "")
		return
	}

	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	var resized image.Image = img
	needResize := width > w.cfg.MaxImageWidth
	if needResize {
		newH := height * w.cfg.MaxImageWidth / width
		resized = imaging.Resize(img, w.cfg.MaxImageWidth, newH, imaging.Lanczos)
	}

	thumb := imaging.Fill(resized, 256, 256, imaging.Center, imaging.Lanczos)

	tmpOriginal := a.OriginalPath + ".compress.tmp"
	tmpThumb := thumbPathFor(w.cfg.ThumbsDir, a)

	out, err := os.Create(tmpOriginal)
	if err != nil {
		log.Printf("[worker] create tmp: %v", err)
		return
	}
	opts := &jpeg.Options{Quality: w.cfg.JPEGQuality}
	if err := jpeg.Encode(out, resized, opts); err != nil {
		out.Close()
		os.Remove(tmpOriginal)
		return
	}
	fi, err := out.Stat()
	out.Close()
	if err != nil {
		os.Remove(tmpOriginal)
		return
	}
	// Atomic swap: rename over the original keeps readers consistent.
	if err := os.Rename(tmpOriginal, a.OriginalPath); err != nil {
		os.Remove(tmpOriginal)
		log.Printf("[worker] rename %s: %v", a.ID, err)
		return
	}

	if err := os.MkdirAll(filepath.Dir(tmpThumb), 0o750); err == nil {
		tf, terr := os.Create(tmpThumb)
		if terr != nil {
			log.Printf("[worker] create thumbnail %s: %v", a.ID, terr)
			tmpThumb = ""
		} else {
			if err := jpeg.Encode(tf, thumb, &jpeg.Options{Quality: w.cfg.JPEGQuality}); err != nil {
				log.Printf("[worker] encode thumbnail %s: %v", a.ID, err)
				tmpThumb = ""
			}
			tf.Close()
		}
	} else {
		tmpThumb = ""
	}

	newSize := fi.Size()
	if !needResize && int64(newSize) >= a.FileSize {
		// Re-encode didn't help — keep DB size truthful with current file.
		newSize = a.FileSize
	}
	if err := w.repo.MarkResized(ctx, a.ID, newSize, tmpThumb); err != nil {
		log.Printf("[worker] mark resized %s: %v", a.ID, err)
	}
}

// memoryPressure reports whether Go's heap exceeds the configured guardrail.
func (w *CompressionWorker) memoryPressure() bool {
	var ms runtime.MemStats
	runtime.ReadMemStats(&ms)
	return ms.HeapAlloc > w.cfg.MemoryLimit
}

// thumbPathFor mirrors the photo layout into the thumbnails tree:
// /data/photos/[user]/[YYYY]/[MM]/[DD]/file → /data/thumbnails/[user]/[YYYY]/[MM]/[DD]/[id]_thumb.jpg
func thumbPathFor(thumbsDir string, a *models.Asset) string {
	rel := strings.TrimPrefix(a.OriginalPath, "/")
	d := filepath.Join(thumbsDir, filepath.Dir(rel))
	return filepath.Join(d, a.ID+"_thumb.jpg")
}
