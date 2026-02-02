/**
 * Parse --example parameter and resolve to download source
 */

import { ExampleSource, ExampleSourceType, ExamplesRegistry, CommunityExamplesIndex } from './ExampleOptions'

// Patterns for parsing --example argument
const GITHUB_REPO_PATTERN = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/(.+))?$/
const REF_PATTERN = /^(.+)#([a-zA-Z0-9_.-]+)$/

/**
 * Parse --example argument into ExampleSource
 *
 * Supported formats:
 * - "ecommerce-admin" -> Official example
 * - "user/repo" -> GitHub repo (main branch)
 * - "user/repo#v2.0" -> GitHub repo with specific ref
 * - "user/repo/path/to/example" -> GitHub repo with subpath
 * - "user/repo/path#branch" -> GitHub repo with subpath and ref
 */
export function parseExampleArg(
  arg: string,
  registry?: ExamplesRegistry,
  communityIndex?: CommunityExamplesIndex
): ExampleSource {
  // Check for ref suffix (#branch or #tag)
  let ref: string | undefined
  let exampleArg = arg

  const refMatch = arg.match(REF_PATTERN)
  if (refMatch) {
    exampleArg = refMatch[1]
    ref = refMatch[2]
  }

  // Check if it's a GitHub repo format (user/repo or user/repo/path)
  const repoMatch = exampleArg.match(GITHUB_REPO_PATTERN)
  if (repoMatch) {
    const [, owner, repoName, subpath] = repoMatch
    const repo = `${owner}/${repoName}`

    // Check if it's a registered community example
    if (communityIndex && !subpath) {
      const communityExample = communityIndex.examples.find(
        e => e.repo === repo || e.name === exampleArg
      )
      if (communityExample) {
        return {
          type: 'community',
          name: communityExample.name,
          repo: communityExample.repo,
          ref: ref || communityExample.branch || 'main',
          subpath: communityExample.subpath
        }
      }
    }

    // Arbitrary GitHub repo
    return {
      type: 'github',
      name: exampleArg,
      repo,
      ref: ref || 'main',
      subpath
    }
  }

  // Check if it's a registered official example
  if (registry) {
    const officialExample = registry.examples.find(e => e.name === exampleArg)
    if (officialExample) {
      return {
        type: 'official',
        name: officialExample.name,
        repo: registry.repository,
        ref: ref || 'main',
        subpath: officialExample.path
      }
    }
  }

  // Check if it's a registered community example by name
  if (communityIndex) {
    const communityExample = communityIndex.examples.find(e => e.name === exampleArg)
    if (communityExample) {
      return {
        type: 'community',
        name: communityExample.name,
        repo: communityExample.repo,
        ref: ref || communityExample.branch || 'main',
        subpath: communityExample.subpath
      }
    }
  }

  // Default: assume it's an official example name (will fail at download if not found)
  return {
    type: 'official',
    name: exampleArg,
    repo: 'k8w/create-tsrpc-app',
    ref: ref || 'main',
    subpath: `examples/${exampleArg}`
  }
}

/**
 * Get display name for example source type
 */
export function getSourceTypeDisplayName(type: ExampleSourceType, isZhCN: boolean): string {
  const names: Record<ExampleSourceType, { zh: string; en: string }> = {
    official: { zh: '官方示例', en: 'Official' },
    community: { zh: '社区示例', en: 'Community' },
    github: { zh: 'GitHub 仓库', en: 'GitHub' }
  }
  return isZhCN ? names[type].zh : names[type].en
}

/**
 * Resolve full download URL for an example source
 */
export function getDownloadUrl(source: ExampleSource): string {
  const repo = source.repo || 'k8w/create-tsrpc-app'
  const ref = source.ref || 'main'
  return `https://codeload.github.com/${repo}/tar.gz/${ref}`
}

/**
 * Validate example source
 */
export function validateExampleSource(source: ExampleSource): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!source.name) {
    errors.push('Example name is required')
  }

  if (source.type === 'github' && !source.repo) {
    errors.push('GitHub repository is required for github type')
  }

  if (source.repo && !GITHUB_REPO_PATTERN.test(source.repo)) {
    errors.push(`Invalid repository format: ${source.repo}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
