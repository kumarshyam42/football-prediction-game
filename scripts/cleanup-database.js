#!/usr/bin/env node

/**
 * Database cleanup script
 * Removes all test data from the database
 *
 * Usage:
 *   node scripts/cleanup-database.js
 *
 * Or to keep players but remove games and predictions:
 *   node scripts/cleanup-database.js --keep-players
 */

const { sql } = require('@vercel/postgres');

async function cleanupDatabase(keepPlayers = false) {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Delete predictions first (foreign key constraint)
    console.log('Deleting predictions...');
    const { rowCount: predictionsDeleted } = await sql`DELETE FROM predictions`;
    console.log(`✓ Deleted ${predictionsDeleted} predictions\n`);

    // Delete games
    console.log('Deleting games...');
    const { rowCount: gamesDeleted } = await sql`DELETE FROM games`;
    console.log(`✓ Deleted ${gamesDeleted} games\n`);

    // Delete players (unless --keep-players flag is used)
    if (!keepPlayers) {
      console.log('Deleting players...');
      const { rowCount: playersDeleted } = await sql`DELETE FROM players`;
      console.log(`✓ Deleted ${playersDeleted} players\n`);
    } else {
      console.log('⏭️  Skipping players (--keep-players flag used)\n');
    }

    // Reset sequences to start IDs from 1
    console.log('Resetting ID sequences...');
    await sql`ALTER SEQUENCE games_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE predictions_id_seq RESTART WITH 1`;
    if (!keepPlayers) {
      await sql`ALTER SEQUENCE players_id_seq RESTART WITH 1`;
    }
    console.log('✓ ID sequences reset\n');

    console.log('✅ Database cleanup complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const keepPlayers = process.argv.includes('--keep-players');

cleanupDatabase(keepPlayers);
