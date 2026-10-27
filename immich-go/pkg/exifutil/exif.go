// Package exifutil extracts the subset of EXIF metadata Immich clients need:
// capture date, GPS coordinates and camera make/model. Pure Go, no CGO.
package exifutil

import (
	"os"
	"time"

	"github.com/rwcarlsen/goexif/exif"
)

// Info is the extracted metadata bundle for one image.
type Info struct {
	DateTimeOriginal *time.Time
	Latitude         *float64
	Longitude        *float64
	Make             string
	Model          string
	Orientation    int
}

// Extract parses an image file's EXIF block. A JPEG/PNG without any EXIF is
// not an error: we return a zero-value Info so callers can still store the
// asset with filesystem-derived timestamps.
func Extract(path string) (*Info, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	x, err := exif.Decode(f)
	if err != nil {
		// goexif returns plain errors ("No Exif header", unknown format, …)
		// when a file simply has no metadata. That is normal for screenshots
		// and re-encodes — treat it as "no usable metadata", never fail the
		// upload over it.
		return &Info{}, nil
	}

	info := &Info{}

	// DateTimeOriginal ("2006:01:02 15:04:05")
	if dt, err := x.DateTime(); err == nil {
		info.DateTimeOriginal = &dt
	}

	// GPS lat/lon (signed rationals carry hemisphere in ref tags).
	lat, lon, err := x.LatLong()
	if err == nil {
		info.Latitude = &lat
		info.Longitude = &lon
	}

	if tag, err := x.Get(exif.Make); err == nil {
		if v, err := tag.StringVal(); err == nil {
			info.Make = trimASCIIZ(v)
		}
	}
	if tag, err := x.Get(exif.Model); err == nil {
		if v, err := tag.StringVal(); err == nil {
			info.Model = trimASCIIZ(v)
		}
	}
	if tag, err := x.Get(exif.Orientation); err == nil {
		if v, err := tag.Int(0); err == nil {
			info.Orientation = v
		}
	}
	return info, nil
}

// trimASCIIZ strips padding nulls some cameras append to strings.
func trimASCIIZ(s string) string {
	for len(s) > 0 && (s[len(s)-1] == '\x00' || s[len(s)-1] == ' ') {
		s = s[:len(s)-1]
	}
	return s
}
