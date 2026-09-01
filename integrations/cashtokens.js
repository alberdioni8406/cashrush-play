/**
 * CASHRUSH — Future CashToken integration (PLACEHOLDER)
 *
 * Version 1: All Token Orbs and collectibles are purely virtual.
 * This module is prepared for a later phase where selected
 * Token Orbs or achievements could map to real CashToken NFTs
 * or fungible tokens — without affecting offline play.
 *
 * Suggested future API surface:
 * - mintAchievementTrophy(achievementId)
 * - claimEventReward(eventId)
 * - getOwnedTokens(address)
 */

export const CashTokens = {
  enabled: false,

  async claim(achievementId) {
    console.info('[CASHRUSH] CashToken claims are not available in Version 1.');
    return { success: false, reason: 'v1_disabled' };
  },

  async getBalance() {
    return 0;
  }
};
