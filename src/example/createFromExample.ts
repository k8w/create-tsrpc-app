/**
 * Create a new project from a downloaded example
 */

import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import { i18n, isZhCN } from '../i18n/i18n'
import { ensureSymlinks } from '../models/ensureSymlinks'
import { getInstallEnv, npmInstall } from '../models/npmInstall'
import { spinner } from '../models/spinner'
import { exampleCache } from './ExampleCache'
import { downloadExample, verifyExample } from './ExampleDownloader'
import { ExampleJson, ExampleSource } from './ExampleOptions'
import { parseExampleArg, getSourceTypeDisplayName } from './ExampleResolver'
import { loadRegistry, loadCommunityExamples } from './ExampleRegistry'

const SCREEN_WIDTH = 40

export interface CreateFromExampleOptions {
  /** Target project directory */
  projectDir: string
  /** Example source (parsed from --example argument) */
  exampleSource: ExampleSource
  /** Skip npm install */
  skipInstall?: boolean
}

export interface CreateFromExampleResult {
  success: boolean
  projectDir: string
  metadata?: ExampleJson
  errors?: string[]
}

let totalStep = 0
let finishedStep = 0
let currentDoingText: string | undefined

function doing(text: string, postFix: string = '...') {
  if (currentDoingText) {
    return
  }
  currentDoingText = text
  spinner.prefixText = chalk.yellow(` → ${++finishedStep}/${totalStep} ${text}${postFix}`)
  spinner.start()
}

function done(succ: boolean = true, text?: string) {
  spinner.prefixText = ''
  if (currentDoingText) {
    text = `${finishedStep}/${totalStep} ${text ?? currentDoingText}`
    succ ? spinner.succeed(chalk.green(text)) : spinner.fail(chalk.red(text))
    currentDoingText = undefined
  }
}

/**
 * Create a project from an example
 */
export async function createFromExample(
  options: CreateFromExampleOptions
): Promise<CreateFromExampleResult> {
  const { projectDir, exampleSource, skipInstall } = options
  const errors: string[] = []

  // Reset step counter
  totalStep = 5 // Download, Verify, Copy, Symlink, Install
  finishedStep = 0
  currentDoingText = undefined

  spinner.text = ''
  spinner.color = 'yellow'

  const appName = path.basename(path.resolve(projectDir))

  console.log(i18n.example.creatingFrom(
    getSourceTypeDisplayName(exampleSource.type, isZhCN),
    exampleSource.name
  ))

  // Step 1: Download example
  doing(i18n.example.downloading)
  let downloadResult
  try {
    downloadResult = await downloadExample(exampleSource, exampleCache)
    done(true)
  } catch (error) {
    done(false)
    const errMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      projectDir,
      errors: [i18n.example.downloadFailed(errMsg)]
    }
  }

  // Step 2: Verify example structure
  doing(i18n.example.verifying)
  const verification = await verifyExample(downloadResult.extractedPath)
  if (!verification.valid) {
    done(false)
    return {
      success: false,
      projectDir,
      errors: verification.errors.map(e => i18n.example.verifyError(e))
    }
  }
  done(true)

  // Step 3: Copy to project directory
  doing(i18n.example.copying(projectDir))
  try {
    await fs.ensureDir(projectDir)
    await fs.copy(downloadResult.extractedPath, projectDir, { recursive: true })

    // Update package.json names if they exist
    await updatePackageNames(projectDir, appName)
    done(true)
  } catch (error) {
    done(false)
    const errMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      projectDir,
      errors: [i18n.example.copyFailed(errMsg)]
    }
  }

  // Step 4: Setup symlinks (if both frontend and backend exist)
  if (verification.hasBackend && verification.hasFrontend) {
    doing(i18n.example.settingUpSymlink)
    try {
      await ensureSymlinks([{
        src: path.join(projectDir, 'backend/src/shared'),
        dst: path.join(projectDir, 'frontend/src/shared')
      }])
      done(true)
    } catch (error) {
      done(false)
      errors.push(i18n.example.symlinkFailed)
    }
  } else {
    totalStep-- // Adjust total steps
  }

  // Step 5: Install dependencies
  if (!skipInstall) {
    doing(i18n.npmInstall, i18n.mayLongPleaseWait)
    const installEnv = await getInstallEnv()

    const installTasks: Promise<boolean>[] = []
    const backendDir = path.join(projectDir, 'backend')
    const frontendDir = path.join(projectDir, 'frontend')

    if (verification.hasBackend && await fs.pathExists(path.join(backendDir, 'package.json'))) {
      installTasks.push(npmInstall(installEnv.cmd, backendDir))
    }
    if (verification.hasFrontend && await fs.pathExists(path.join(frontendDir, 'package.json'))) {
      installTasks.push(npmInstall(installEnv.cmd, frontendDir))
    }

    const results = await Promise.all(installTasks)
    const allSuccess = results.every(r => r)
    done(allSuccess)

    if (!allSuccess) {
      errors.push(i18n.example.installFailed)
    }
  } else {
    totalStep--
  }

  // Output success message
  console.log(chalk.green(`\n${'='.repeat(SCREEN_WIDTH)}\n`))

  if (errors.length === 0) {
    console.log(i18n.example.createSuccess)
  } else {
    console.log(i18n.example.createSuccessWithProblems)
    errors.forEach(e => console.log(chalk.yellow(`  - ${e}`)))
  }

  // Print next steps
  console.log(i18n.runLocalServer)

  if (verification.hasBackend) {
    console.log(`= ${i18n.backend} =\n`)
    console.log(chalk.cyan(`    cd ${path.join(path.relative('.', projectDir), 'backend')}`))
    console.log(chalk.cyan(`    npm run dev\n`))
  }

  if (verification.hasFrontend) {
    console.log(`= ${i18n.frontend} =\n`)
    console.log(chalk.cyan(`    cd ${path.join(path.relative('.', projectDir), 'frontend')}`))
    console.log(chalk.cyan(`    npm run dev\n`))
  }

  spinner.text = ''
  spinner.stop()

  return {
    success: errors.length === 0,
    projectDir,
    metadata: downloadResult.metadata,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Update package.json names in backend and frontend
 */
async function updatePackageNames(projectDir: string, appName: string): Promise<void> {
  const dirs = ['backend', 'frontend']

  for (const dir of dirs) {
    const pkgPath = path.join(projectDir, dir, 'package.json')
    if (await fs.pathExists(pkgPath)) {
      try {
        const pkg = await fs.readJson(pkgPath)
        pkg.name = `${appName}-${dir}`
        await fs.writeJson(pkgPath, pkg, { spaces: 2 })
      } catch {
        // Ignore errors updating package.json
      }
    }
  }
}

/**
 * Main entry point for --example command
 */
export async function handleExampleCommand(
  projectDir: string,
  exampleArg: string
): Promise<void> {
  // Load registry and community examples
  const registry = await loadRegistry()
  const communityExamples = await loadCommunityExamples()

  // Parse example argument
  const exampleSource = parseExampleArg(exampleArg, registry, communityExamples)

  // Create project
  const result = await createFromExample({
    projectDir,
    exampleSource
  })

  if (!result.success) {
    throw new Error(result.errors?.join('\n') || 'Failed to create project from example')
  }
}
