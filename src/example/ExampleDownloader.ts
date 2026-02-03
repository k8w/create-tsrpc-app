/**
 * Download and extract examples from GitHub
 * Uses codeload.github.com for fast tarball downloads
 */

import fs from 'fs-extra'
import path from 'path'
import https from 'https'
import http from 'http'
import { pipeline } from 'stream/promises'
import { createGunzip } from 'zlib'
import tar from 'tar'
import { ExampleCache, exampleCache } from './ExampleCache'
import { ExampleJson, ExampleSource } from './ExampleOptions'
import { i18n } from '../i18n/i18n'

const GITHUB_API_BASE = 'https://api.github.com'
const CODELOAD_BASE = 'https://codeload.github.com'
const REQUEST_TIMEOUT_MS = 30000 // 30 seconds

export interface DownloadResult {
  /** Path to extracted example */
  extractedPath: string
  /** Commit SHA used for caching */
  commitSha: string
  /** Parsed example.json if exists */
  metadata?: ExampleJson
}

/**
 * Get the latest commit SHA for a repo/ref
 */
async function getCommitSha(repo: string, ref: string = 'main'): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `${GITHUB_API_BASE}/repos/${repo}/commits/${ref}`
    const options = {
      headers: {
        'User-Agent': 'create-tsrpc-app',
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: REQUEST_TIMEOUT_MS
    }

    const req = https.get(url, options, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location
        if (location) {
          https.get(location, options, handleResponse).on('error', handleError)
          return
        }
      }
      handleResponse(res)

      function handleResponse(response: http.IncomingMessage) {
        // Provide specific error messages based on status code
        if (response.statusCode === 404) {
          reject(new Error(i18n.example.repoNotAccessible(repo)))
          return
        }
        if (response.statusCode === 403) {
          reject(new Error(i18n.example.rateLimitExceeded))
          return
        }
        if (response.statusCode !== 200) {
          reject(new Error(`GitHub API returned ${response.statusCode}`))
          return
        }

        let data = ''
        response.on('data', chunk => data += chunk)
        response.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json.sha)
          } catch (e) {
            reject(new Error('Failed to parse GitHub API response'))
          }
        })
      }
    })

    req.on('error', handleError)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error(i18n.example.networkTimeout))
    })

    function handleError(error: Error) {
      if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNRESET')) {
        reject(new Error(i18n.example.networkTimeout))
      } else {
        reject(error)
      }
    }
  })
}

/**
 * Download tarball from GitHub codeload
 */
async function downloadTarball(
  repo: string,
  ref: string,
  destPath: string
): Promise<void> {
  await fs.ensureDir(path.dirname(destPath))

  const url = `${CODELOAD_BASE}/${repo}/tar.gz/${ref}`

  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'create-tsrpc-app' },
      timeout: REQUEST_TIMEOUT_MS
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location
        if (location) {
          https.get(location, { headers: { 'User-Agent': 'create-tsrpc-app' } }, handleResponse)
            .on('error', handleError)
          return
        }
      }
      handleResponse(res)

      function handleResponse(response: http.IncomingMessage) {
        if (response.statusCode === 404) {
          reject(new Error(i18n.example.repoNotAccessible(repo)))
          return
        }
        if (response.statusCode === 403) {
          reject(new Error(i18n.example.rateLimitExceeded))
          return
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`))
          return
        }

        const file = fs.createWriteStream(destPath)
        pipeline(response, file)
          .then(resolve)
          .catch(reject)
      }
    })

    req.on('error', handleError)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error(i18n.example.networkTimeout))
    })

    function handleError(error: Error) {
      if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNRESET')) {
        reject(new Error(i18n.example.networkTimeout))
      } else {
        reject(error)
      }
    }
  })
}

/**
 * Extract tarball to directory
 */
async function extractTarball(
  tarballPath: string,
  destDir: string,
  subpath?: string
): Promise<string> {
  await fs.ensureDir(destDir)

  // Extract to temp location first to handle root directory
  const tempExtract = path.join(destDir, '_extract_temp')
  await fs.ensureDir(tempExtract)

  await tar.extract({
    file: tarballPath,
    cwd: tempExtract,
    strip: 1 // Remove the top-level directory (repo-ref/)
  })

  // If subpath specified, move only that directory
  let sourcePath = tempExtract
  if (subpath) {
    sourcePath = path.join(tempExtract, subpath)
    if (!(await fs.pathExists(sourcePath))) {
      await fs.remove(tempExtract)
      throw new Error(`Subpath "${subpath}" not found in repository`)
    }
  }

  // Move to final location
  const finalPath = path.join(destDir, 'example')
  await fs.move(sourcePath, finalPath)

  // Cleanup
  if (subpath) {
    await fs.remove(tempExtract)
  }

  return finalPath
}

/**
 * Read and parse example.json from extracted example
 */
async function readExampleJson(extractedPath: string): Promise<ExampleJson | undefined> {
  const jsonPath = path.join(extractedPath, 'example.json')

  if (!(await fs.pathExists(jsonPath))) {
    return undefined
  }

  try {
    return await fs.readJson(jsonPath)
  } catch {
    return undefined
  }
}

/**
 * Download an example from GitHub
 */
export async function downloadExample(
  source: ExampleSource,
  cache: ExampleCache = exampleCache
): Promise<DownloadResult> {
  const repo = source.repo || `k8w/create-tsrpc-app`
  const ref = source.ref || 'main'
  const subpath = source.subpath

  // Get commit SHA for cache key
  let commitSha: string
  try {
    commitSha = await getCommitSha(repo, ref)
  } catch (e) {
    // If we can't get SHA, use ref directly (less optimal caching)
    commitSha = ref
  }

  // Check cache
  const cachedPath = await cache.getCachedExample(repo, ref, commitSha, subpath)
  if (cachedPath) {
    const metadata = await readExampleJson(cachedPath)
    return {
      extractedPath: cachedPath,
      commitSha,
      metadata
    }
  }

  // Download
  const tempDir = cache.getTempDir()
  const tarballPath = path.join(tempDir, 'download.tar.gz')

  try {
    await downloadTarball(repo, ref, tarballPath)

    // Extract
    const extractedPath = await extractTarball(tarballPath, tempDir, subpath)

    // Read metadata
    const metadata = await readExampleJson(extractedPath)

    // Add to cache
    const cachedExamplePath = await cache.addToCache(
      repo,
      ref,
      commitSha,
      extractedPath,
      subpath
    )

    // Cleanup temp tarball
    await fs.remove(tarballPath)

    return {
      extractedPath: cachedExamplePath,
      commitSha,
      metadata
    }
  } catch (error) {
    // Cleanup on error
    await cache.cleanupTemp(tempDir)
    throw error
  }
}

/**
 * Verify an example has valid structure
 */
export async function verifyExample(examplePath: string): Promise<{
  valid: boolean
  hasMetadata: boolean
  hasBackend: boolean
  hasFrontend: boolean
  errors: string[]
}> {
  const errors: string[] = []

  const hasMetadata = await fs.pathExists(path.join(examplePath, 'example.json'))
  const hasBackend = await fs.pathExists(path.join(examplePath, 'backend'))
  const hasFrontend = await fs.pathExists(path.join(examplePath, 'frontend'))

  if (!hasMetadata) {
    errors.push('Missing example.json')
  }

  if (!hasBackend && !hasFrontend) {
    errors.push('Example must have at least backend/ or frontend/ directory')
  }

  return {
    valid: errors.length === 0,
    hasMetadata,
    hasBackend,
    hasFrontend,
    errors
  }
}
