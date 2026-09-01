/**
 * CASHRUSH — Future online verification layer (PLACEHOLDER)
 *
 * Version 1 stores everything locally.
 * Later this module can verify selected achievements or
 * tournament scores against an optional backend or on-chain
 * attestation while keeping the game fully playable offline.
 */

export const Verification = {
  async verifyAchievement(id, payload) {
    console.info('[CASHRUSH] Online verification not implemented in V1.');
    return { verified: false };
  },

  async submitScore(score, metadata) {
    return { accepted: false };
  }
};
