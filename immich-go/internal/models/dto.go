// Package models holds database row structs and JSON DTOs that must match
// Immich's OpenAPI schemas exactly (field names, casing, nullability).
package models

import "time"

// User is a row in the users table.
type User struct {
	ID               string
	Email            string
	Password         string // bcrypt hash, compatible with upstream Immich
	Name             string
	AvatarColor      string
	IsAdmin          bool
	DeletedAt        *time.Time
	CreatedAt        time.Time
	UpdatedAt        time.Time
	ProfileImagePath string
	OnboardedAt      *time.Time
}

// AssetType mirrors Immich's AssetTypeEnum ('IMAGE' | 'VIDEO').
type AssetType string

const (
	AssetTypeImage AssetType = "IMAGE"
	AssetTypeVideo AssetType = "VIDEO"
)

// AssetStatus mirrors Immich's AssetStatusEnum.
type AssetStatus string

const (
	StatusActive  AssetStatus = "ACTIVE"
	StatusTrashed AssetStatus = "TRASHED"
	StatusDeleted AssetStatus = "DELETED"
)

// Asset is a row in the assets table.
type Asset struct {
	ID              string
	DeviceAssetID   *string
	Type            AssetType
	OriginalPath    string
	ResizePath      *string // thumbnail
	EncodedVideoPath *string
	UserID          string
	OwnerID         string
	FileCreatedAt   time.Time
	FileModifiedAt  *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
	ArchivedAt      *time.Time
	DeletedAt       *time.Time
	IsFavorite      bool
	IsVisible       bool
	Status          AssetStatus
	Source          string
	DuplicationID   *string // sha256 of content, used for dedupe
	FileSize        int64
	Resized         bool
	Thumbhash       string
	Exif            *ExifInfo
}

// ExifInfo is a row in the exif table.
type ExifInfo struct {
	AssetID          string
	DateTimeOriginal *time.Time
	Country          *string
	State            *string
	City             *string
	Make             *string
	Model            *string
	LensModel        *string
	Latitude         *float64
	Longitude        *float64
	Orientation      int
	BitsPerSample    *int
	ColorSpace       *string
	FrameRate        *float64
	FileSize         int64
	ImageWidth       int
	ImageHeight      int
}

// Album is a row in the albums table.
type Album struct {
	ID          string
	AlbumName   string
	Description string
	Order       string
	OwnerID     string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   *time.Time
	AssetCount  int `json:"-"`
	Assets      []Asset `json:"-"`
}

// ---------------------------------------------------------------------------
// DTOs — field order & names replicate open-api/immich-openapi-specs.json so
// Flutter/Dart generated SDKs parse them without surprises.
// ---------------------------------------------------------------------------

// LoginCredentialDto: POST /api/auth/login body.
type LoginCredentialDto struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponseDto returned by /api/auth/login (and /auth/admin-sign-up).
type LoginResponseDto struct {
	AccessToken         string `json:"accessToken"`
	UserID              string `json:"userId"`
	UserEmail           string `json:"userEmail"`
	Name                string `json:"name"`
	IsAdmin             bool   `json:"isAdmin"`
	ShouldChangePassword bool  `json:"shouldChangePassword"`
	IsOnboarded         bool   `json:"isOnboarded"`
	ProfileImagePath    string `json:"profileImagePath"`
}

// UserResponseDto: GET /api/users/me ("user/me" in older clients).
type UserResponseDto struct {
	ID               string    `json:"id"`
	Email            string    `json:"email"`
	Name             string    `json:"name"`
	AvatarColor      string    `json:"avatarColor"`
	ProfileImagePath string    `json:"profileImagePath"`
	ProfileChangedAt time.Time `json:"profileChangedAt"`
}

// ServerVersionResponseDto: GET /api/server/version.
type ServerVersionResponseDto struct {
	Major         int  `json:"major"`
	Minor         int  `json:"minor"`
	Patch         int  `json:"patch"`
	Prerelease    *int `json:"prerelease"`
	FeatureLevel  int  `json:"featureLevel"`
}

// ServerConfigDto: GET /api/server/config.
type ServerConfigDto struct {
	ExternalDomain            string `json:"externalDomain"`
	LoginMessage              string `json:"loginPageMessage"`
	OauthButtonText           string `json:"oauthButtonText"`
	OauthAccountManagementUrl string `json:"oauthAccountManagementUrl"`
	PublicUsers               bool   `json:"publicUsers"`
	UserDeleteDelay           int    `json:"userDeleteDelay"`
	TrashDays                 int    `json:"trashDays"`
	MapLightStyleURL          string `json:"mapLightStyleUrl"`
	MapDarkStyleURL           string `json:"mapDarkStyleUrl"`
	IsInitialized             bool   `json:"isInitialized"`
	IsOnboarded               bool   `json:"isOnboarded"`
	MaintenanceMode           bool   `json:"maintenanceMode"`
	MinFaces                  int    `json:"minFaces"`
}

// ServerFeaturesDto: GET /api/server/features — all heavy features disabled.
type ServerFeaturesDto struct {
	Clipboard             bool `json:"clipboard,omitempty"`
	ConfigFile            bool `json:"configFile"`
	FacialRecognition     bool `json:"facialRecognition"`
	ImportFaces           bool `json:"importFaces"`
	Sidecar               bool `json:"sidecar"`
	Search                bool `json:"search"`
	OAuth                 bool `json:"oauth"`
	OAuthAutoLaunch       bool `json:"oauthAutoLaunch"`
	ReverseGeocoding      bool `json:"reverseGeocoding"`
	PasswordLogin         bool `json:"passwordLogin"`
	SessionSync           bool `json:"sessionSync,omitempty"`
	TwoFactorAuthentication bool `json:"twoFactorAuthentication,omitempty"`
	VirtualLogin          bool `json:"virtualLogin,omitempty"`
	VirtualLoginWait      bool `json:"virtualLoginWait,omitempty"`
	NotificationEmail     bool `json:"email"`
	Map                   bool `json:"map"`
	EvalSmartSearch       bool `json:"smartSearch"`
	DuplicateDetection    bool `json:"duplicateDetection"`
	Trash                 bool `json:"trash"`
	People                bool `json:"people,omitempty"`
	Stacking              bool `json:"stacking,omitempty"`
	TagRooms              bool `json:"tagItems,omitempty"`
	RealtimeTranscoding   bool `json:"realtimeTranscoding"`
	OnThisDay             bool `json:"onThisDay,omitempty"`
	OCR                   bool `json:"ocr"`
}

// AuthStatusDto: GET /api/auth/status (some client builds probe this at boot).
type AuthStatusDto struct {
	HasAdmin        bool `json:"hasAdmin"`
	PasswordLogin   bool `json:"passwordLogin"`
	OAuthEnabled    bool `json:"oauthEnabled"`
}

// ExifInfoDto embedded into asset responses.
type ExifInfoDto struct {
	Make              *string  `json:"make"`
	Model             *string  `json:"model"`
	ExifImageWidth    int      `json:"exifImageWidth"`
	ExifImageHeight   int      `json:"exifImageHeight"`
	FileSizeInByte    int64    `json:"fileSizeInByte"`
	Orientation       *int     `json:"orientation"`
	DateTimeOriginal  *string  `json:"dateTimeOriginal"`
	ModifyDate        *string  `json:"modifyDate"`
	TimeZone          *string  `json:"timeZone"`
	Latitude          *float64 `json:"latitude"`
	Longitude         *float64 `json:"longitude"`
	Country           *string  `json:"country"`
	State             *string  `json:"state"`
	City              *string  `json:"city"`
	ProjectionType    *string  `json:"projectionType"`
	Binary            any      `json:"binary"`
	LicenseText       *string  `json:"licenseText"`
	Copyright         *string  `json:"copyright"`
	LensModel         *string  `json:"lensModel"`
	FilmNegative      *string  `json:"filmNegative"`
	PhotoMode         *string  `json:"photoMode"`
	Level             *string  `json:"level"`
	Focus             *string  `json:"focus"`
	MeteringMode      *string  `json:"meteringMode"`
	FileCreatedAt     *string  `json:"fileCreatedAt"`
	FileModifiedAt    *string  `json:"fileModifiedAt"`
	IsPortrait        bool     `json:"isPortrait"`
	Rating            *int     `json:"rating"`
	Fps               *float64 `json:"fps"`
	EXIFJSON          any      `json:"updateInfo"`
}

// AssetResponseDto: the shape mobile clients expect from every asset endpoint.
// Field set follows AssetItemDto/AssetResponseDto of the Immich OpenAPI spec;
// unknown extra fields are ignored by the Dart SDK, missing nullable ones are OK.
type AssetResponseDto struct {
	ID                string       `json:"id"`
	DeviceAssetID     *string      `json:"deviceAssetId"`
	OwnerID           string       `json:"ownerId"`
	UserID            string       `json:"userId"`
	DeviceID          string       `json:"deviceId"`
	LibraryAssetID    *string      `json:"libraryAssetId"`
	Type              AssetType    `json:"type"`
	Thumbhash         string       `json:"thumbhash"`
	IsFavorite        bool         `json:"isFavorite"`
	AreLinksVisible   bool         `json:"areLinksVisible,omitempty"`
	Visibility        string       `json:"visibility,omitempty"`
	ArchivedAt        *string      `json:"archivedAt"`
	CreatedAt         string       `json:"createdAt"`
	DeletedAt         *string      `json:"deletedAt"`
	FileModifiedAt    *string      `json:"fileModifiedAt"`
	LocalDateTime     *string      `json:"localDateTime"`
	UpdatedAt         string       `json:"updatedAt"`
	ExifInfo          ExifInfoDto  `json:"exifInfo"`
	LivePhotoVideoID  *string      `json:"livePhotoVideoId"`
	People            []any        `json:"people"`
	Stack             *StackDto    `json:"stack"`
	ProjectIDs        []string     `json:"projectIds"`
	WithGeolocation   bool         `json:"withGeolocation,omitempty"`
	WithMetadata      bool         `json:"withMetadata,omitempty"`
	Resized           bool         `json:"-"` // internal flag for worker state
}

// StackDto minimal stack object (stacking disabled but field must exist).
type StackDto struct {
	ID          string `json:"id"`
	AssetCount  int    `json:"assetCount"`
	Assets      []any  `json:"assets,omitempty"`
}

// AlbumResponseDto matches Immich's album endpoints.
type AlbumResponseDto struct {
	AlbumName        string             `json:"albumName"`
	Description      string             `json:"description"`
	AssetCount       int                `json:"assetCount"`
	Assets           []AssetResponseDto `json:"assets,omitempty"`
	AlbumUsers       []any              `json:"albumUsers"`
	Shared           bool               `json:"shared"`
	StartDate        *string            `json:"startDate"`
	EndDate          *string            `json:"endDate"`
	ID               string             `json:"id"`
	OwnerID          string             `json:"ownerId"`
	Owners           []any              `json:"owners"`
	IsActivityEnabled bool              `json:"isActivityEnabled"`
	Order            string             `json:"order"`
	CreatedAt        string             `json:"createdAt"`
	UpdatedAt        string             `json:"updatedAt"`
	Thumbnail        any                `json:"thumbnail"`
}

// ServerInfoDto aggregates info for legacy clients that call /api/server-info.
type ServerInfoDto struct {
	Version    string            `json:"version"`
	BuildInfo  map[string]string `json:"buildInformation"`
}

// JSONTime formats times the way NestJS does: ISO-8601 with milliseconds & Z.
func JSONTime(t time.Time) string {
	return t.UTC().Format("2006-01-02T15:04:05.000Z")
}

// OptionalJSONTime returns a formatted pointer or nil (serialized as null).
func OptionalJSONTime(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := JSONTime(*t)
	return &s
}

// strPtr helper for DTO construction.
func StrPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// IntPtr helper.
func IntPtr(i int) *int { return &i }
