/**
 * Heartbeat Service
 * 
 * Sends periodic heartbeats to wake the agent up on a schedule.
 * 
 * SILENT MODE: Agent's text output is NOT auto-delivered.
 * The agent must use `lettabot-message` CLI via Bash to contact the user.
 */

import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LettaBot } from '../core/bot.js';
import type { TriggerContext } from '../core/types.js';
import { buildHeartbeatPrompt } from '../core/prompts.js';
import { getLastRunTime } from '../tools/letta-api.js';

// Log file
const LOG_PATH = resolve(process.cwd(), 'cron-log.jsonl');

function logEvent(event: string, data: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...data,
  };
  
  try {
    appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
  } catch {
    // Ignore
  }
  
  console.log(`[Heartbeat] ${event}:`, JSON.stringify(data));
}

/**
 * Heartbeat configuration
 */
export interface HeartbeatConfig {
  enabled: boolean;
  intervalMinutes: number;
  workingDir: string;
  
  // Custom heartbeat prompt (optional)
  prompt?: string;
  
  // Target for delivery (optional - defaults to last messaged)
  target?: {
    channel: string;
    chatId: string;
  };
}

/**
 * Heartbeat Service
 */
export class HeartbeatService {
  private bot: LettaBot;
  private config: HeartbeatConfig;
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor(bot: LettaBot, config: HeartbeatConfig) {
    this.bot = bot;
    this.config = config;
  }
  
  /**
   * Start the heartbeat timer
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('[Heartbeat] Disabled');
      return;
    }
    
    if (this.intervalId) {
      console.log('[Heartbeat] Already running');
      return;
    }
    
    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    
    console.log(`[Heartbeat] Starting in SILENT MODE (every ${this.config.intervalMinutes} minutes)`);
    console.log(`[Heartbeat] First heartbeat in ${this.config.intervalMinutes} minutes`);
    
    // Wait full interval before first heartbeat (don't fire on startup)
    this.intervalId = setInterval(() => this.runHeartbeat(), intervalMs);
    
    logEvent('heartbeat_started', {
      intervalMinutes: this.config.intervalMinutes,
      mode: 'silent',
      note: 'Agent must use lettabot-message CLI to contact user',
    });
  }
  
  /**
   * Stop the heartbeat timer
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Heartbeat] Stopped');
    }
  }
  
  /**
   * Manually trigger a heartbeat (for /heartbeat command)
   * Bypasses the "recently active" check since user explicitly requested it
   */
  async trigger(): Promise<void> {
    console.log('[Heartbeat] Manual trigger requested');
    await this.runHeartbeat(true); // skipActiveCheck = true
  }
  
  /**
   * Run a single heartbeat
   * 
   * SILENT MODE: Agent's text output is NOT auto-delivered.
   * The agent must use `lettabot-message` CLI via Bash to contact the user.
   * 
   * @param skipActiveCheck - If true, bypass the "recently active" check (for manual triggers)
   */
  private async runHeartbeat(skipActiveCheck = false): Promise<void> {
    const now = new Date();
    const formattedTime = now.toLocaleString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Heartbeat] ⏰ RUNNING at ${formattedTime} [SILENT MODE]`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Check if agent was active recently (skip heartbeat if so)
    // Skip this check for manual triggers (/heartbeat command)
    if (!skipActiveCheck) {
      const agentId = this.bot.getStatus().agentId;
      if (agentId) {
        const lastRunTime = await getLastRunTime(agentId);
        if (lastRunTime) {
          const msSinceLastRun = now.getTime() - lastRunTime.getTime();
          const intervalMs = this.config.intervalMinutes * 60 * 1000;
          
          if (msSinceLastRun < intervalMs) {
            const minutesAgo = Math.round(msSinceLastRun / 60000);
            console.log(`[Heartbeat] Agent was active ${minutesAgo}m ago - skipping heartbeat`);
            logEvent('heartbeat_skipped_active', {
              lastRunTime: lastRunTime.toISOString(),
              minutesAgo,
            });
            return;
          }
        }
      }
    }
    
    console.log(`[Heartbeat] Sending heartbeat to agent...`);
    
    logEvent('heartbeat_running', { 
      time: now.toISOString(),
      mode: 'silent',
    });
    
    // Build trigger context for silent mode
    const lastTarget = this.bot.getLastMessageTarget();
    const triggerContext: TriggerContext = {
      type: 'heartbeat',
      outputMode: 'silent',
      sourceChannel: lastTarget?.channel,
      sourceChatId: lastTarget?.chatId,
    };
    
    try {
      // Build the heartbeat message with clear SILENT MODE indication
      const message = buildHeartbeatPrompt(formattedTime, timezone, this.config.intervalMinutes);
      
      console.log(`[Heartbeat] Sending prompt (SILENT MODE):\n${'─'.repeat(50)}\n${message}\n${'─'.repeat(50)}\n`);
      
      // Send to agent - response text is NOT delivered (silent mode)
      // Agent must use `lettabot-message` CLI via Bash to send messages
      const response = await this.bot.sendToAgent(message, triggerContext);
      
      // Log results
      console.log(`[Heartbeat] Agent finished.`);
      console.log(`  - Response text: ${response?.length || 0} chars (NOT delivered - silent mode)`);
      
      if (response && response.trim()) {
        console.log(`  - Response preview: "${response.slice(0, 100)}${response.length > 100 ? '...' : ''}"`);
      }
      
      logEvent('heartbeat_completed', {
        mode: 'silent',
        responseLength: response?.length || 0,
      });
      
    } catch (error) {
      console.error('[Heartbeat] Error:', error);
      logEvent('heartbeat_error', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
