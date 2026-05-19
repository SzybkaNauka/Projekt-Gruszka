import { runCampaignSanityCheck } from '../src/game/campaignSanity.js';

function main() {
  const summary = runCampaignSanityCheck();
  console.log('SANITY_SUMMARY_JSON_START');
  console.log(JSON.stringify(summary, null, 2));
  console.log('SANITY_SUMMARY_JSON_END');
}

main();
