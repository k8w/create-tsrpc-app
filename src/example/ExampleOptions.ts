/**
 * Example system type definitions
 */

/** Localized string with multi-language support */
export interface LocalizedString {
  'zh-CN': string
  'en-US': string
}

/** Server protocol type */
export type ServerProtocol = 'http' | 'ws'

/** Client platform type */
export type ClientPlatform = 'react' | 'vue3' | 'browser' | 'none'

/** Technology stack configuration */
export interface ExampleStack {
  server: ServerProtocol
  client: ClientPlatform
}

/** Difficulty level */
export type ExampleDifficulty = 'beginner' | 'intermediate' | 'advanced'

/**
 * example.json schema - metadata for an example project
 * This file must exist in every valid TSRPC example
 */
export interface ExampleJson {
  // === Required fields ===

  /** Unique identifier, used for CLI parameter (e.g., --example ecommerce-admin) */
  name: string

  /** Compatible TSRPC version range (SemVer format, e.g., "^3.0.0", ">=3.4.0 <5.0.0") */
  tsrpcVersion: string

  /** Display name with multi-language support */
  displayName: LocalizedString

  /** Description with multi-language support */
  description: LocalizedString

  /** Technology stack configuration */
  stack: ExampleStack

  // === Optional fields ===

  /** Version number (SemVer) */
  version?: string

  /** Author */
  author?: string

  /** Repository URL (for community examples) */
  repository?: string

  /** Tags for search and categorization */
  tags?: string[]

  /** Difficulty level */
  difficulty?: ExampleDifficulty

  /** Feature list */
  features?: string[]

  /** Minimum Node.js version requirement */
  minNodeVersion?: string

  /** Screenshot path (relative to example root) */
  screenshot?: string

  /** Live demo URL */
  demoUrl?: string

  /** External dependencies (to notify users) */
  externalDependencies?: string[]
}

/**
 * Source type for --example parameter
 */
export type ExampleSourceType =
  | 'official'      // Official example from examples/ directory
  | 'community'     // Community example from community-examples.json
  | 'github'        // Arbitrary GitHub repo (user/repo format)

/**
 * Parsed example source from CLI argument
 */
export interface ExampleSource {
  type: ExampleSourceType
  /** For official: example name; for github: user/repo */
  name: string
  /** GitHub repository (for community and github types) */
  repo?: string
  /** Branch or tag (default: main) */
  ref?: string
  /** Subpath within the repo */
  subpath?: string
}

/**
 * Resolved example with full metadata
 */
export interface ResolvedExample {
  source: ExampleSource
  /** Full download URL */
  downloadUrl: string
  /** Commit SHA for cache key */
  commitSha?: string
  /** Parsed example.json metadata */
  metadata?: ExampleJson
}

/**
 * Registry entry for official examples
 */
export interface RegistryExample {
  name: string
  /** Compatible TSRPC version range (SemVer format) */
  tsrpcVersion: string
  displayName: LocalizedString
  displayNameEn?: string  // Legacy field
  description: LocalizedString
  path: string
  tags?: string[]
  difficulty?: ExampleDifficulty
  stack: ExampleStack
}

/**
 * Official examples registry format (res/examples-registry.json)
 */
export interface ExamplesRegistry {
  version: number
  repository: string
  examples: RegistryExample[]
}

/**
 * Community example entry
 */
export interface CommunityExample {
  name: string
  repo: string
  branch?: string
  subpath?: string
  /** Compatible TSRPC version range (SemVer format) */
  tsrpcVersion: string
  description?: LocalizedString
  author?: string
  stars?: number
  addedAt?: string
  /** Whether this example has been verified by maintainers */
  verified?: boolean
}

/**
 * Community examples index format (community-examples.json)
 */
export interface CommunityExamplesIndex {
  version: number
  lastUpdated?: string
  examples: CommunityExample[]
}

/**
 * Cache metadata for downloaded examples
 */
export interface CacheEntry {
  commitSha: string
  downloadedAt: string
  /** Last access time for expiry tracking */
  lastAccessedAt: string
  exampleName: string
  path: string
}

/**
 * Cache index file format
 */
export interface CacheIndex {
  version: number
  entries: Record<string, CacheEntry>
}
