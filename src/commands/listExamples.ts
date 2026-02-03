/**
 * --list-examples command implementation
 * Lists all available official and community examples
 */

import chalk from 'chalk'
import { i18n, isZhCN } from '../i18n/i18n'
import { getAllExamples } from '../example/ExampleRegistry'
import { RegistryExample, CommunityExample, LocalizedString, ExampleDifficulty } from '../example/ExampleOptions'

/**
 * Get localized string value
 */
function getLocalizedValue(str: LocalizedString | string | undefined): string {
  if (!str) return ''
  if (typeof str === 'string') return str
  return isZhCN ? str['zh-CN'] : str['en-US']
}

/**
 * Get difficulty display
 */
function getDifficultyDisplay(difficulty?: ExampleDifficulty): string {
  if (!difficulty) return ''
  const display = i18n.example.difficulty[difficulty]
  const colors: Record<ExampleDifficulty, (s: string) => string> = {
    beginner: chalk.green,
    intermediate: chalk.yellow,
    advanced: chalk.red
  }
  return colors[difficulty](`[${display}]`)
}

/**
 * Format tags for display
 */
function formatTags(tags?: string[]): string {
  if (!tags || tags.length === 0) return ''
  return chalk.gray(tags.join(', '))
}

/**
 * Render a single example entry
 */
function renderExample(
  name: string,
  displayName: string,
  description: string,
  tsrpcVersion: string,
  difficulty?: ExampleDifficulty,
  tags?: string[],
  isOfficial: boolean = false
): void {
  const badge = isOfficial ? chalk.green(' ⭐ 官方') : ''
  const diffDisplay = getDifficultyDisplay(difficulty)
  const versionDisplay = chalk.blue(`[TSRPC ${tsrpcVersion}]`)

  console.log(chalk.cyan(`  ${name}`) + `  ${versionDisplay} ${diffDisplay}${badge}`)
  console.log(`    ${displayName}`)
  if (description) {
    console.log(chalk.gray(`    ${description}`))
  }
  if (tags && tags.length > 0) {
    console.log(chalk.gray(`    ${i18n.example.tags}: ${tags.join(', ')}`))
  }
  console.log('')
}

/**
 * Render official examples section
 */
function renderOfficialExamples(examples: RegistryExample[]): void {
  if (examples.length === 0) return

  console.log('')
  console.log(i18n.example.officialSection)
  console.log('')

  for (const example of examples) {
    renderExample(
      example.name,
      getLocalizedValue(example.displayName),
      getLocalizedValue(example.description),
      example.tsrpcVersion,
      example.difficulty,
      example.tags,
      true
    )
  }
}

/**
 * Render community examples section
 */
function renderCommunityExamples(examples: CommunityExample[]): void {
  if (examples.length === 0) return

  console.log('')
  console.log(i18n.example.communitySection)
  console.log('')

  for (const example of examples) {
    const description = example.description
      ? getLocalizedValue(example.description)
      : ''
    const author = example.author ? chalk.gray(` by ${example.author}`) : ''
    const stars = example.stars ? chalk.yellow(` ⭐ ${example.stars}`) : ''
    const versionDisplay = chalk.blue(`[TSRPC ${example.tsrpcVersion}]`)

    console.log(chalk.cyan(`  ${example.name}`) + `  ${versionDisplay}` + stars)
    console.log(`    ${example.repo}${author}`)
    if (description) {
      console.log(chalk.gray(`    ${description}`))
    }
    console.log('')
  }
}

/**
 * Main command handler for --list-examples
 */
export async function cmdListExamples(): Promise<void> {
  console.log('')
  console.log(chalk.bold(i18n.example.listTitle))

  const { official, community } = await getAllExamples()

  if (official.length === 0 && community.length === 0) {
    console.log(chalk.gray(i18n.example.noExamples))
    console.log('')
    return
  }

  renderOfficialExamples(official)
  renderCommunityExamples(community)

  // Print usage hint
  console.log(i18n.example.usage)
}
