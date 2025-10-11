#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const args = process.argv.slice(2);
const command = args[0];

const ENVIRONMENTS = {
  prod: process.env.DATABASE_URL,
  dev: process.env.DEV_DATABASE_URL,
};

function setDatabaseUrl(env) {
  const url = ENVIRONMENTS[env];
  if (!url) {
    throw new Error(`${env.toUpperCase()}_DATABASE_URL not found in environment variables`);
  }
  
  process.env.DATABASE_URL = url;
  console.log(`Using ${env} database: ${url.replace(/:[^:@]+@/, ':***@')}`);
}

async function runMigrations(env) {
  console.log(`Running migrations for ${env} environment...`);
  setDatabaseUrl(env);
  
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log(`✅ Migrations completed for ${env}`);
  } catch (error) {
    console.error(`❌ Migration failed for ${env}:`, error);
    process.exit(1);
  }
}

async function runSeed(env) {
  console.log(`Running seed for ${env} environment...`);
  setDatabaseUrl(env);
  
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log(`✅ Seed completed for ${env}`);
  } catch (error) {
    console.error(`❌ Seed failed for ${env}:`, error);
    process.exit(1);
  }
}

async function generateClient() {
  console.log('Generating Prisma client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Client generated');
  } catch (error) {
    console.error('❌ Client generation failed:', error);
    process.exit(1);
  }
}

async function resetDatabase(env) {
  console.log(`Resetting ${env} database...`);
  setDatabaseUrl(env);
  
  try {
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    console.log(`✅ Database reset completed for ${env}`);
  } catch (error) {
    console.error(`❌ Database reset failed for ${env}:`, error);
    process.exit(1);
  }
}

async function syncDatabases(from, to) {
  console.log(`Syncing database from ${from} to ${to}...`);
  
  const fromClient = new PrismaClient({
    datasources: { db: { url: ENVIRONMENTS[from] } }
  });
  
  const toClient = new PrismaClient({
    datasources: { db: { url: ENVIRONMENTS[to] } }
  });
  
  try {
    // Define the tables to sync in reverse dependency order (children first, then parents)
    const tablesToSync = [
      // Delete dependent tables first (tables that reference others)
      'eventApplication',
      'linkRequestProof',
      'linkRequest',
      'userPlayer',
      'playerStats',
      'userAuditLog',
      'allianceStats',
      'playerCommander',
      'playerEquipment',
      'applicationCommander',
      'applicationEquipment',
      'equipmentAttribute',
      'equipmentIconicAttribute',
      'equipmentMaterial',
      'commanderPairing',
      'commanderSkillTree',
      'eventRanking',
      
      // Then parent tables (tables that are referenced by others)
      'player',
      'alliance',
      'equipment',
      'commander',
      'attribute',
      'material',
      'user',
      'event'
    ];

    console.log(`⚠️  WARNING: This will replace ALL data in ${to} database!`);
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    // Wait 5 seconds for user to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // First, clear all tables in reverse order to handle foreign keys
    console.log('\nClearing target database...');
    for (const tableName of tablesToSync) {
      try {
        if (toClient[tableName]) {
          await toClient[tableName].deleteMany({});
          console.log(`  - Cleared ${tableName}`);
        }
      } catch (error) {
        console.log(`  - Warning: Could not clear ${tableName}: ${error.message}`);
      }
    }
    
    let totalSynced = 0;
    
    // Then sync data in forward order (parents first, then children)
    console.log('\nSyncing data...');
    for (const tableName of tablesToSync.reverse()) {
      try {
        console.log(`\nSyncing ${tableName}...`);
        
        // Get all data from source table
        const sourceData = await fromClient[tableName].findMany();
        
        if (sourceData.length === 0) {
          console.log(`  ✓ ${tableName}: No data to sync`);
          continue;
        }
        
        // Tables are already cleared above, so just insert data
        const batchSize = 100;
        let inserted = 0;
        
        for (let i = 0; i < sourceData.length; i += batchSize) {
          const batch = sourceData.slice(i, i + batchSize);
          await toClient[tableName].createMany({
            data: batch,
            skipDuplicates: true
          });
          inserted += batch.length;
        }
        
        console.log(`  ✓ ${tableName}: ${inserted} records synced`);
        totalSynced += inserted;
        
      } catch (error) {
        console.log(`  ⚠️  ${tableName}: Skipped (${error.message})`);
      }
    }
    
    console.log(`\n✅ Sync completed! ${totalSynced} total records synced from ${from} to ${to}`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  } finally {
    await fromClient.$disconnect();
    await toClient.$disconnect();
  }
}

async function syncSingleTable(tableName, from, to) {
  console.log(`Syncing table '${tableName}' from ${from} to ${to}...`);
  
  const fromClient = new PrismaClient({
    datasources: { db: { url: ENVIRONMENTS[from] } }
  });
  
  const toClient = new PrismaClient({
    datasources: { db: { url: ENVIRONMENTS[to] } }
  });
  
  try {
    // Check if table exists
    if (!fromClient[tableName] || !toClient[tableName]) {
      throw new Error(`Table '${tableName}' not found in Prisma schema`);
    }
    
    console.log(`⚠️  WARNING: This will replace ALL data in ${tableName} table in ${to} database!`);
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get source data
    const sourceData = await fromClient[tableName].findMany();
    
    if (sourceData.length === 0) {
      console.log(`✓ No data to sync in ${tableName}`);
      return;
    }
    
    // For tables with foreign key constraints, we need to clear dependent tables first
    const tableDependencies = {
      'user': ['userPlayer', 'linkRequest', 'linkRequestProof', 'userAuditLog', 'eventApplication'],
      'alliance': ['allianceStats', 'player', 'eventApplication'],
      'player': ['playerStats', 'userPlayer', 'playerCommander', 'playerEquipment'],
      'commander': ['user', 'playerCommander', 'applicationCommander', 'commanderPairing', 'commanderSkillTree'],
      'equipment': ['playerEquipment', 'applicationEquipment', 'equipmentAttribute', 'equipmentIconicAttribute', 'equipmentMaterial'],
      'attribute': ['equipmentAttribute', 'equipmentIconicAttribute'],
      'material': ['equipmentMaterial'],
      'event': ['eventApplication', 'eventRanking']
    };
    
    // Clear dependent tables first if they exist
    if (tableDependencies[tableName]) {
      console.log(`- Clearing dependent tables first...`);
      for (const depTable of tableDependencies[tableName]) {
        try {
          if (toClient[depTable]) {
            await toClient[depTable].deleteMany({});
            console.log(`  - Cleared ${depTable}`);
          }
        } catch (error) {
          console.log(`  - Warning: Could not clear ${depTable}: ${error.message}`);
        }
      }
    }
    
    // Clear target table
    try {
      await toClient[tableName].deleteMany({});
      console.log(`- Cleared ${tableName} in ${to}`);
    } catch (error) {
      if (error.message.includes('Foreign key constraint')) {
        console.log(`❌ Cannot clear ${tableName} due to foreign key constraints.`);
        console.log(`Try running a full database sync instead: yarn db:sync:prod-to-dev`);
        return;
      }
      throw error;
    }
    
    // Insert data in batches
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);
      try {
        await toClient[tableName].createMany({
          data: batch,
          skipDuplicates: true
        });
        inserted += batch.length;
      } catch (error) {
        console.log(`Warning: Batch ${i}-${i + batch.length} failed: ${error.message}`);
      }
    }
    
    console.log(`✅ Successfully synced ${inserted} records in ${tableName} from ${from} to ${to}`);
    
  } catch (error) {
    console.error(`❌ Failed to sync ${tableName}:`, error.message);
    process.exit(1);
  } finally {
    await fromClient.$disconnect();
    await toClient.$disconnect();
  }
}

async function setEnvironment(env) {
  if (!['dev', 'prod'].includes(env)) {
    console.error('Please specify environment: dev or prod');
    process.exit(1);
  }
  
  const url = ENVIRONMENTS[env];
  if (!url) {
    console.error(`${env.toUpperCase()}_DATABASE_URL not found in environment variables`);
    process.exit(1);
  }
  
  // Set the DATABASE_URL for this session
  process.env.DATABASE_URL = url;
  console.log(`✅ Environment set to ${env}`);
  console.log(`Database: ${url.replace(/:[^:@]+@/, ':***@')}`);
  console.log('You can now run Prisma commands like: yarn prisma studio');
}

async function openStudio(env) {
  if (!['dev', 'prod'].includes(env)) {
    console.error('Please specify environment: dev or prod');
    process.exit(1);
  }
  
  console.log(`Opening Prisma Studio for ${env} environment...`);
  setDatabaseUrl(env);
  
  try {
    execSync('npx prisma studio', { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Failed to open Prisma Studio for ${env}:`, error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Database Management Script

Usage: node scripts/db-manager.js <command> [options]

Commands:
  migrate <env>         Run migrations (env: dev|prod)
  seed <env>            Run seed (env: dev|prod)
  reset <env>           Reset database (env: dev|prod)
  generate              Generate Prisma client
  sync <from> <to>      Sync data between databases (dev|prod)
  setup                 Setup both environments (migrate + seed)
  set <env>             Set environment for subsequent commands (dev|prod)
  studio <env>          Open Prisma Studio for specific environment (dev|prod)
  sync-table <table> <from> <to>  Sync specific table between databases
  help                  Show this help message

Examples:
  node scripts/db-manager.js migrate dev
  node scripts/db-manager.js seed prod
  node scripts/db-manager.js sync dev prod
  node scripts/db-manager.js sync-table user dev prod
  node scripts/db-manager.js setup
  node scripts/db-manager.js set dev
  node scripts/db-manager.js studio dev
`);
}

async function setupBoth() {
  console.log('Setting up both environments...');
  await generateClient();
  await runMigrations('dev');
  await runMigrations('prod');
  await runSeed('dev');
  await runSeed('prod');
  console.log('✅ Both environments are ready!');
}

// Main execution
async function main() {
  try {
    switch (command) {
      case 'migrate':
        if (!args[1] || !['dev', 'prod'].includes(args[1])) {
          console.error('Please specify environment: dev or prod');
          process.exit(1);
        }
        await runMigrations(args[1]);
        break;
        
      case 'seed':
        if (!args[1] || !['dev', 'prod'].includes(args[1])) {
          console.error('Please specify environment: dev or prod');
          process.exit(1);
        }
        await runSeed(args[1]);
        break;
        
      case 'reset':
        if (!args[1] || !['dev', 'prod'].includes(args[1])) {
          console.error('Please specify environment: dev or prod');
          process.exit(1);
        }
        await resetDatabase(args[1]);
        break;
        
      case 'generate':
        await generateClient();
        break;
        
      case 'sync':
        if (!args[1] || !args[2] || !['dev', 'prod'].includes(args[1]) || !['dev', 'prod'].includes(args[2])) {
          console.error('Please specify source and target: dev or prod');
          process.exit(1);
        }
        await syncDatabases(args[1], args[2]);
        break;
        
      case 'sync-table':
        if (!args[1] || !args[2] || !args[3] || !['dev', 'prod'].includes(args[2]) || !['dev', 'prod'].includes(args[3])) {
          console.error('Usage: sync-table <tableName> <from> <to>');
          console.error('Example: sync-table user dev prod');
          process.exit(1);
        }
        await syncSingleTable(args[1], args[2], args[3]);
        break;
        
      case 'setup':
        await setupBoth();
        break;
        
      case 'set':
        if (!args[1] || !['dev', 'prod'].includes(args[1])) {
          console.error('Please specify environment: dev or prod');
          process.exit(1);
        }
        await setEnvironment(args[1]);
        break;
        
      case 'studio':
        if (!args[1] || !['dev', 'prod'].includes(args[1])) {
          console.error('Please specify environment: dev or prod');
          process.exit(1);
        }
        await openStudio(args[1]);
        break;
        
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
