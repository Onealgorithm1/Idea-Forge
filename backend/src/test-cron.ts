import { sendSummaryEmail } from './cron.js';

async function test() {
  console.log('Testing weekly summary email...');
  await sendSummaryEmail('weekly', 7);
  console.log('Finished testing weekly summary email.');
  process.exit(0);
}

test();
