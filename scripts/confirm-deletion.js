// File Deletion Confirmation Script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🗑️  File Deletion Confirmation\n');

// Files to review based on scan results
const filesToReview = [
  {
    path: 'scripts/test_whatsapp_leads.sql',
    type: 'suspicious',
    reason: 'Test SQL file - likely no longer needed',
    size: '213 B',
    recommendation: 'SAFE TO DELETE'
  },
  {
    path: 'src/pages/TestPage.tsx',
    type: 'suspicious',
    reason: 'Test page component - likely no longer needed',
    size: '696 B',
    recommendation: 'SAFE TO DELETE'
  },
  {
    path: 'src/test/example.test.ts',
    type: 'suspicious',
    reason: 'Test file - no test framework configured',
    size: '150 B',
    recommendation: 'SAFE TO DELETE'
  },
  {
    path: 'test-node.js',
    type: 'suspicious',
    reason: 'Temporary test script',
    size: '129 B',
    recommendation: 'SAFE TO DELETE'
  },
  {
    path: 'public/icon-192.png',
    type: 'duplicate',
    reason: 'Duplicate of public/icons/icon-192.png',
    size: '41.1 KB',
    recommendation: 'SAFE TO DELETE'
  },
  {
    path: 'public/icon-512.png',
    type: 'duplicate',
    reason: 'Duplicate of public/icons/icon-512.png',
    size: '241.7 KB',
    recommendation: 'SAFE TO DELETE'
  },
  {
    path: 'supabase/.temp/cli-latest',
    type: 'temp',
    reason: 'Supabase temporary file',
    size: '7 B',
    recommendation: 'SAFE TO DELETE'
  },
  {
    path: 'supabase/.temp/storage-version',
    type: 'temp',
    reason: 'Supabase temporary file',
    size: '66 B',
    recommendation: 'SAFE TO DELETE'
  }
];

// Files to KEEP (important)
const filesToKeep = [
  {
    path: 'src/assets/landing-hero.png',
    reason: 'Landing page hero image - likely used',
    size: '1.4 MB',
    recommendation: 'KEEP'
  },
  {
    path: 'src/assets/home-background.png',
    reason: 'Home page background - likely used',
    size: '1.3 MB',
    recommendation: 'KEEP'
  },
  {
    path: 'src/assets/super-like-heart.png',
    reason: 'Super like feature image - likely used',
    size: '1.3 MB',
    recommendation: 'KEEP'
  },
  {
    path: 'src/components/ErrorBoundary.tsx',
    reason: 'Error boundary component - important for error handling',
    size: '1 KB',
    recommendation: 'KEEP'
  },
  {
    path: 'src/main.tsx',
    reason: 'Main application entry point - CRITICAL',
    size: '1 KB',
    recommendation: 'KEEP - DO NOT DELETE'
  },
  {
    path: 'src/components/FloatingLikeParticles.tsx',
    reason: 'UI component - likely used in the app',
    size: '1.8 KB',
    recommendation: 'KEEP'
  },
  {
    path: 'src/components/ui/card.tsx',
    reason: 'UI component - likely used throughout the app',
    size: '1.8 KB',
    recommendation: 'KEEP'
  },
  {
    path: 'supabase/migrations/20260306092525_0e4b2752-a53f-4f06-ba7c-cbc100fe445e.sql',
    reason: 'Database migration - important for database schema',
    size: '66 B',
    recommendation: 'KEEP - DO NOT DELETE'
  },
  {
    path: 'supabase/migrations/20260306094930_245cbdb2-2898-4ff1-9eb5-39ae0e4ecada.sql',
    reason: 'Database migration - important for database schema',
    size: '66 B',
    recommendation: 'KEEP - DO NOT DELETE'
  }
];

console.log('📋 FILES RECOMMENDED FOR DELETION:\n');
console.log('⚠️  These files appear safe to remove:\n');

filesToReview.forEach((file, index) => {
  console.log(`${index + 1}. ${file.path}`);
  console.log(`   Type: ${file.type}`);
  console.log(`   Size: ${file.size}`);
  console.log(`   Reason: ${file.reason}`);
  console.log(`   Recommendation: ${file.recommendation}`);
  console.log('');
});

console.log('\n📋 FILES TO KEEP (DO NOT DELETE):\n');

filesToKeep.forEach((file, index) => {
  console.log(`${index + 1}. ${file.path}`);
  console.log(`   Reason: ${file.reason}`);
  console.log(`   Size: ${file.size}`);
  console.log(`   Recommendation: ${file.recommendation}`);
  console.log('');
});

console.log('🔧 DELETION COMMANDS:\n');
console.log('To delete the safe files, run these commands individually:\n');

filesToReview.forEach(file => {
  if (file.recommendation === 'SAFE TO DELETE') {
    console.log(`# Remove ${file.path}`);
    console.log(`Remove-Item -Force "${file.path.replace(/\//g, '\\')}"`);
    console.log('');
  }
});

console.log('📊 SUMMARY:\n');
console.log(`Files safe to delete: ${filesToReview.filter(f => f.recommendation === 'SAFE TO DELETE').length}`);
console.log(`Space saved: ~${(41.1 + 241.7 + 0.213 + 0.696 + 0.150 + 0.129).toFixed(1)} KB`);
console.log(`Files to keep: ${filesToKeep.length}`);
console.log(`Large assets to review: 3 (check if actually used in code)`);

console.log('\n⚠️  FINAL WARNING:');
console.log('1. Create a backup before deleting any files');
console.log('2. Verify these files are not referenced in your code');
console.log('3. Test your app after deletion');
console.log('4. The large image files should be checked for actual usage');

console.log('\n✅ When ready, you can safely delete the marked files.');
