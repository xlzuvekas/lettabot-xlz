/**
 * Skills Sync - Interactive checklist to manage skills in working directory
 */

import { existsSync, readdirSync, cpSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { PROJECT_SKILLS_DIR, GLOBAL_SKILLS_DIR, SKILLS_SH_DIR, parseSkillFile } from './loader.js';

const HOME = process.env.HOME || process.env.USERPROFILE || '';
const WORKING_DIR = process.env.WORKING_DIR || '/tmp/lettabot';
const TARGET_DIR = join(WORKING_DIR, '.skills');

interface SkillInfo {
  name: string;
  description: string;
  source: 'builtin' | 'clawdhub' | 'skills.sh';
  sourcePath: string;
  installed: boolean;
}

/**
 * Discover all available skills from all sources
 */
function discoverSkills(): SkillInfo[] {
  const skills: SkillInfo[] = [];
  const seen = new Set<string>();
  
  // Get existing skills in target
  const installedSkills = new Set<string>();
  if (existsSync(TARGET_DIR)) {
    for (const entry of readdirSync(TARGET_DIR, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        installedSkills.add(entry.name);
      }
    }
  }
  
  // Helper to add skills from a directory
  const addFromDir = (dir: string, source: SkillInfo['source']) => {
    if (!existsSync(dir)) return;
    
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        if (seen.has(entry.name)) continue;
        
        const skillPath = join(dir, entry.name, 'SKILL.md');
        const skill = parseSkillFile(skillPath);
        
        if (skill) {
          seen.add(entry.name);
          skills.push({
            name: entry.name,
            description: skill.description || '',
            source,
            sourcePath: join(dir, entry.name),
            installed: installedSkills.has(entry.name),
          });
        }
      }
    } catch (e) {
      // Ignore errors reading directories
    }
  };
  
  // Discover from all sources
  addFromDir(PROJECT_SKILLS_DIR, 'builtin');
  addFromDir(GLOBAL_SKILLS_DIR, 'clawdhub');
  addFromDir(SKILLS_SH_DIR, 'skills.sh');
  
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Interactive skills sync with checklist
 */
export async function runSkillsSync(): Promise<void> {
  p.intro('🔄 Skills Sync');
  
  const skills = discoverSkills();
  
  if (skills.length === 0) {
    p.note(
      'No skills found.\n\n' +
      'Install skills with:\n' +
      '  npm run skill:install <name>     (ClawdHub)\n' +
      '  npm run skills:add <owner/repo>  (skills.sh)',
      'No skills available'
    );
    p.outro('');
    return;
  }
  
  const installedCount = skills.filter(s => s.installed).length;
  
  p.log.info(`Target: ${TARGET_DIR}`);
  p.log.info(`Found ${skills.length} skills (${installedCount} installed)`);
  p.log.info('Legend: 📦 builtin  🐾 ClawdHub  ⚡ skills.sh\n');
  
  // Build options for multiselect with descriptions as hints
  const options = skills.map(skill => {
    const sourceIcon = skill.source === 'builtin' ? '📦' : skill.source === 'clawdhub' ? '🐾' : '⚡';
    
    // Truncate description if too long
    const desc = skill.description || '';
    const hint = desc.length > 60 ? desc.slice(0, 57) + '...' : desc;
    
    return {
      value: skill.name,
      label: `${sourceIcon} ${skill.name}`,
      hint,
    };
  });
  
  // Start with no skills selected (user must explicitly enable)
  const selected = await p.multiselect({
    message: 'Enable skills (space=toggle, enter=confirm):',
    options,
    initialValues: [], // Disabled by default
    required: false,
  });
  
  if (p.isCancel(selected)) {
    p.cancel('Cancelled');
    return;
  }
  
  const selectedSet = new Set(selected as string[]);
  
  // Determine what to add and remove
  const toAdd = skills.filter(s => selectedSet.has(s.name) && !s.installed);
  const toRemove = skills.filter(s => !selectedSet.has(s.name) && s.installed);
  
  if (toAdd.length === 0 && toRemove.length === 0) {
    p.log.info('No changes needed');
    p.log.info(`Skills directory: ${TARGET_DIR}`);
    p.outro('✨ Done!');
    return;
  }
  
  // Confirm changes
  const confirmMsg = [];
  if (toAdd.length > 0) confirmMsg.push(`Add ${toAdd.length} skill(s)`);
  if (toRemove.length > 0) confirmMsg.push(`Remove ${toRemove.length} skill(s)`);
  
  const confirmed = await p.confirm({
    message: `${confirmMsg.join(', ')}?`,
  });
  
  if (!confirmed || p.isCancel(confirmed)) {
    p.cancel('Cancelled');
    return;
  }
  
  // Ensure target directory exists
  mkdirSync(TARGET_DIR, { recursive: true });
  
  // Add new skills
  for (const skill of toAdd) {
    const dest = join(TARGET_DIR, skill.name);
    try {
      cpSync(skill.sourcePath, dest, { recursive: true });
      p.log.success(`Added: ${skill.name}`);
    } catch (e) {
      p.log.error(`Failed to add ${skill.name}: ${e}`);
    }
  }
  
  // Remove skills
  for (const skill of toRemove) {
    const dest = join(TARGET_DIR, skill.name);
    try {
      rmSync(dest, { recursive: true, force: true });
      p.log.warn(`Removed: ${skill.name}`);
    } catch (e) {
      p.log.error(`Failed to remove ${skill.name}: ${e}`);
    }
  }
  
  p.log.info(`Skills directory: ${TARGET_DIR}`);
  p.outro(`✨ Added ${toAdd.length}, removed ${toRemove.length} skill(s)`);
}
