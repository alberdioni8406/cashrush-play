/**
 * CASHRUSH — Future Bitcoin Cash wallet integration (PLACEHOLDER)
 *
 * Version 1: No real wallet connection.
 * This module is intentionally inert so core gameplay never depends on crypto.
 *
 * Future responsibilities:
 * - Optional wallet connect / disconnect
 * - Read-only address display for linked profiles
 * - Sign messages for achievement verification
 *
 * Never require a wallet to play.
 */

export const Wallet = {
  isAvailable() {
    return false; // V1
  },

  async connect() {
    console.info('[CASHRUSH] Wallet connect is not implemented in Version 1.');
    return null;
  },

  async disconnect() {
    return true;
  },

  getAddress() {
    return null;
  }
};
