/**
 * Cache management for downloaded examples and registry
 * Cache location: ~/.cta-cache/
 */

import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { CacheIndex, CacheEntry, ExamplesRegistry } from './ExampleOptions'

const CACHE_DIR = path.join(os.homedir(), '.cta-cache')
const CACHE_INDEX_FILE = 'cache-index.json'
const REGISTRY_CACHE_FILE = 'registry.json'
const REGISTRY_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours
const EXAMPLE_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Example cache manager
 */
export class ExampleCache {
  private cacheDir: string
  private indexPath: string
  private registryPath: string

  constructor(cacheDir: string = CACHE_DIR) {
    this.cacheDir = cacheDir
    this.indexPath = path.join(cacheDir, CACHE_INDEX_FILE)
    this.registryPath = path.join(cacheDir, REGISTRY_CACHE_FILE)
  }

  /**
   * Ensure cache directory exists
   */
  async ensureCacheDir(): Promise<void> {
    await fs.ensureDir(this.cacheDir)
    await fs.ensureDir(path.join(this.cacheDir, 'examples'))
  }

  /**
   * Get cache index
   */
  async getIndex(): Promise<CacheIndex> {
    try {
      if (await fs.pathExists(this.indexPath)) {
        return await fs.readJson(this.indexPath)
      }
    } catch {
      // Ignore corrupted cache
    }
    return { version: 1, entries: {} }
  }

  /**
   * Save cache index
   */
  async saveIndex(index: CacheIndex): Promise<void> {
    await this.ensureCacheDir()
    await fs.writeJson(this.indexPath, index, { spaces: 2 })
  }

  /**
   * Generate cache key for an example
   */
  getCacheKey(repo: string, ref: string, subpath?: string): string {
    const parts = [repo.replace('/', '_'), ref]
    if (subpath) {
      parts.push(subpath.replace(/\//g, '_'))
    }
    return parts.join('__')
  }

  /**
   * Get cached example path if exists and valid
   */
  async getCachedExample(
    repo: string,
    ref: string,
    commitSha?: string,
    subpath?: string
  ): Promise<string | null> {
    const index = await this.getIndex()
    const key = this.getCacheKey(repo, ref, subpath)
    const entry = index.entries[key]

    if (!entry) {
      return null
    }

    // If we have commitSha, verify it matches
    if (commitSha && entry.commitSha !== commitSha) {
      return null
    }

    // Check if cache has expired (7 days since last access)
    const lastAccess = new Date(entry.lastAccessedAt || entry.downloadedAt).getTime()
    if (Date.now() - lastAccess > EXAMPLE_CACHE_MAX_AGE_MS) {
      // Cache expired, remove it
      delete index.entries[key]
      await this.saveIndex(index)
      try {
        await fs.remove(entry.path)
      } catch {
        // Ignore removal errors
      }
      return null
    }

    // Check if cached path still exists
    if (await fs.pathExists(entry.path)) {
      // Update last accessed time
      entry.lastAccessedAt = new Date().toISOString()
      await this.saveIndex(index)
      return entry.path
    }

    // Cache entry invalid, remove it
    delete index.entries[key]
    await this.saveIndex(index)
    return null
  }

  /**
   * Add example to cache
   */
  async addToCache(
    repo: string,
    ref: string,
    commitSha: string,
    extractedPath: string,
    subpath?: string
  ): Promise<string> {
    const index = await this.getIndex()
    const key = this.getCacheKey(repo, ref, subpath)

    // Move to cache directory
    const cachePath = path.join(this.cacheDir, 'examples', key)

    // Remove old cache if exists
    if (await fs.pathExists(cachePath)) {
      await fs.remove(cachePath)
    }

    await fs.move(extractedPath, cachePath)

    // Update index
    const now = new Date().toISOString()
    const entry: CacheEntry = {
      commitSha,
      downloadedAt: now,
      lastAccessedAt: now,
      exampleName: key,
      path: cachePath
    }
    index.entries[key] = entry
    await this.saveIndex(index)

    return cachePath
  }

  /**
   * Get temp directory for download
   */
  getTempDir(): string {
    return path.join(this.cacheDir, 'temp', `download-${Date.now()}`)
  }

  /**
   * Clean up temp directory
   */
  async cleanupTemp(tempDir: string): Promise<void> {
    try {
      await fs.remove(tempDir)
    } catch {
      // Ignore cleanup errors
    }
  }

  // === Registry Cache ===

  /**
   * Get cached registry if valid
   */
  async getCachedRegistry(): Promise<ExamplesRegistry | null> {
    try {
      if (!(await fs.pathExists(this.registryPath))) {
        return null
      }

      const stat = await fs.stat(this.registryPath)
      const age = Date.now() - stat.mtimeMs

      // Check if cache is still fresh
      if (age > REGISTRY_MAX_AGE_MS) {
        return null
      }

      return await fs.readJson(this.registryPath)
    } catch {
      return null
    }
  }

  /**
   * Save registry to cache
   */
  async cacheRegistry(registry: ExamplesRegistry): Promise<void> {
    await this.ensureCacheDir()
    await fs.writeJson(this.registryPath, registry, { spaces: 2 })
  }

  /**
   * Force refresh registry cache
   */
  async invalidateRegistry(): Promise<void> {
    try {
      await fs.remove(this.registryPath)
    } catch {
      // Ignore
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      await fs.remove(this.cacheDir)
    } catch {
      // Ignore
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number
    totalSize: number
    oldestEntry?: string
  }> {
    const index = await this.getIndex()
    const entries = Object.values(index.entries)

    let totalSize = 0
    let oldestEntry: string | undefined

    for (const entry of entries) {
      try {
        const stat = await fs.stat(entry.path)
        totalSize += stat.size
        if (!oldestEntry || entry.downloadedAt < oldestEntry) {
          oldestEntry = entry.downloadedAt
        }
      } catch {
        // Entry may not exist
      }
    }

    return {
      totalEntries: entries.length,
      totalSize,
      oldestEntry
    }
  }
}

// Default cache instance
export const exampleCache = new ExampleCache()
