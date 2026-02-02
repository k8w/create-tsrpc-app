/**
 * Registry management for official and community examples
 * - Official examples: from res/examples-registry.json (embedded in CLI)
 * - Community examples: from community-examples.json (embedded + remote update)
 */

import fs from 'fs-extra'
import path from 'path'
import https from 'https'
import { ExamplesRegistry, CommunityExamplesIndex, RegistryExample, CommunityExample } from './ExampleOptions'
import { exampleCache } from './ExampleCache'

// Embedded registry path (bundled with CLI)
const EMBEDDED_REGISTRY_PATH = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, './res/examples-registry.json')
  : path.resolve(__dirname, '../../res/examples-registry.json')

const EMBEDDED_COMMUNITY_PATH = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, './community-examples.json')
  : path.resolve(__dirname, '../../community-examples.json')

// Remote registry URLs for updates
const REMOTE_REGISTRY_URL = 'https://raw.githubusercontent.com/k8w/create-tsrpc-app/main/res/examples-registry.json'
const REMOTE_COMMUNITY_URL = 'https://raw.githubusercontent.com/k8w/create-tsrpc-app/main/community-examples.json'

/**
 * Load embedded registry (bundled with CLI)
 */
async function loadEmbeddedRegistry(): Promise<ExamplesRegistry> {
  try {
    if (await fs.pathExists(EMBEDDED_REGISTRY_PATH)) {
      return await fs.readJson(EMBEDDED_REGISTRY_PATH)
    }
  } catch {
    // Ignore
  }

  // Return default empty registry
  return {
    version: 1,
    repository: 'k8w/create-tsrpc-app',
    examples: []
  }
}

/**
 * Load embedded community examples (bundled with CLI)
 */
async function loadEmbeddedCommunity(): Promise<CommunityExamplesIndex> {
  try {
    if (await fs.pathExists(EMBEDDED_COMMUNITY_PATH)) {
      return await fs.readJson(EMBEDDED_COMMUNITY_PATH)
    }
  } catch {
    // Ignore
  }

  // Return default empty index
  return {
    version: 1,
    examples: []
  }
}

/**
 * Fetch JSON from remote URL
 */
async function fetchJson<T>(url: string, timeoutMs: number = 5000): Promise<T | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), timeoutMs)

    https.get(url, {
      headers: { 'User-Agent': 'create-tsrpc-app' }
    }, (res) => {
      clearTimeout(timeout)

      if (res.statusCode !== 200) {
        resolve(null)
        return
      }

      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(null)
        }
      })
    }).on('error', () => {
      clearTimeout(timeout)
      resolve(null)
    })
  })
}

/**
 * Load registry with cache + remote update strategy
 *
 * Strategy:
 * 1. Check cache (< 24h) -> use cached
 * 2. Try fetch remote -> update cache
 * 3. Fallback to embedded registry
 */
export async function loadRegistry(forceRefresh: boolean = false): Promise<ExamplesRegistry> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await exampleCache.getCachedRegistry()
    if (cached) {
      return cached
    }
  }

  // Try to fetch remote
  const remote = await fetchJson<ExamplesRegistry>(REMOTE_REGISTRY_URL)
  if (remote && remote.version && remote.examples) {
    await exampleCache.cacheRegistry(remote)
    return remote
  }

  // Fallback to embedded
  return loadEmbeddedRegistry()
}

/**
 * Load community examples with similar strategy
 */
export async function loadCommunityExamples(forceRefresh: boolean = false): Promise<CommunityExamplesIndex> {
  // For community examples, we always try remote first since they change more frequently
  const remote = await fetchJson<CommunityExamplesIndex>(REMOTE_COMMUNITY_URL)
  if (remote && remote.version && remote.examples) {
    return remote
  }

  // Fallback to embedded
  return loadEmbeddedCommunity()
}

/**
 * Get all available examples (official + community)
 */
export async function getAllExamples(): Promise<{
  official: RegistryExample[]
  community: CommunityExample[]
}> {
  const [registry, community] = await Promise.all([
    loadRegistry(),
    loadCommunityExamples()
  ])

  return {
    official: registry.examples,
    community: community.examples
  }
}

/**
 * Find example by name across all sources
 */
export async function findExampleByName(name: string): Promise<{
  type: 'official' | 'community' | null
  example: RegistryExample | CommunityExample | null
}> {
  const { official, community } = await getAllExamples()

  // Check official first
  const officialMatch = official.find(e => e.name === name)
  if (officialMatch) {
    return { type: 'official', example: officialMatch }
  }

  // Check community
  const communityMatch = community.find(e => e.name === name)
  if (communityMatch) {
    return { type: 'community', example: communityMatch }
  }

  return { type: null, example: null }
}

/**
 * Refresh registry cache
 */
export async function refreshRegistry(): Promise<void> {
  await exampleCache.invalidateRegistry()
  await loadRegistry(true)
}
