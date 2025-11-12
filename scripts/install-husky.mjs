import { existsSync } from 'fs'
import { execSync } from 'child_process'

const hasGit = existsSync('.git')

if (hasGit) {
  execSync('npx husky install', { stdio: 'inherit' })
} else {
  console.log('Skipping husky install (no git repository detected).')
}


