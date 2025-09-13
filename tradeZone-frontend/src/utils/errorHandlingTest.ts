/**
 * Test suite to verify error handling and crash prevention
 * This module can be used to simulate various API failure scenarios
 */

import { safeArray, safeLength, safeMap, safeReduce } from './safeArrayUtils';
import { safeGet, safeNumber, safeString, exists } from './safeObjectUtils';

// Test data scenarios that could cause crashes
const testScenarios = {
  nullArray: null,
  undefinedArray: undefined,
  emptyArray: [],
  invalidArray: 'not an array',
  nullObject: null,
  undefinedObject: undefined,
  emptyObject: {},
  invalidObject: 'not an object',
  validArrayWithNulls: [null, undefined, { valid: true }, null],
  validObjectWithMissingProps: { someField: 'exists' },
  deepNestedNull: { level1: { level2: null } },
  mixedTypeArray: [1, 'string', null, { id: 1 }, undefined, true],
};

// Test functions that should handle these scenarios safely
export const runErrorHandlingTests = () => {
  console.log('🧪 Running Error Handling Tests...');

  try {
    // Array handling tests
    console.log('✅ Safe array handling:');
    console.log('- null array length:', safeLength(testScenarios.nullArray));
    console.log('- undefined array map:', safeMap(testScenarios.undefinedArray, (x) => x));
    console.log('- invalid array reduce:', safeReduce(testScenarios.invalidArray as any, (acc, val) => acc + 1, 0));

    // Object property access tests
    console.log('✅ Safe object property access:');
    console.log('- null object field:', safeGet(testScenarios.nullObject, 'field', 'fallback'));
    console.log('- deep nested null:', safeGet(testScenarios.deepNestedNull, 'level1.level2.nonexistent', 'safe'));
    console.log('- missing property:', safeGet(testScenarios.validObjectWithMissingProps, 'missingField', 'default'));

    // Type conversion tests
    console.log('✅ Safe type conversions:');
    console.log('- null to number:', safeNumber(null, 0));
    console.log('- undefined to string:', safeString(undefined, 'empty'));
    console.log('- invalid number:', safeNumber('not a number', 100));

    // Real-world simulation tests
    console.log('✅ Real-world simulation:');
    simulatePositionsAPIFailure();
    simulateWalletsAPIFailure();
    simulateDashboardAPIFailure();

    console.log('🎉 All error handling tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
    return false;
  }
};

// Simulate positions API returning null/undefined
const simulatePositionsAPIFailure = () => {
  const mockPositionsResponse = null; // API returns null

  // This should not crash
  const positions = safeArray(mockPositionsResponse);
  const totalInvested = safeReduce(positions, (sum, pos) => {
    return sum + safeNumber(safeGet(pos, 'investedAmount'), 0);
  }, 0);
  const positionCount = safeLength(positions);

  console.log('  - Positions from null API:', { totalInvested, positionCount });
};

// Simulate wallets API returning incomplete data
const simulateWalletsAPIFailure = () => {
  const mockWalletsResponse = [
    null, // null wallet
    undefined, // undefined wallet
    { /* missing required fields */ },
    { balance: 'not a number', currency: null }, // invalid data types
    { balance: 1000, currency: 'USD', name: 'Valid Wallet' }, // valid wallet
  ];

  // This should not crash and filter out invalid entries
  const wallets = safeArray(mockWalletsResponse);
  const totalBalance = safeReduce(wallets, (sum, wallet) => {
    if (!exists(wallet)) return sum;
    return sum + safeNumber(safeGet(wallet, 'balance'), 0);
  }, 0);

  const validWallets = safeArray(wallets).filter(exists);

  console.log('  - Wallets with invalid data:', { totalBalance, validCount: validWallets.length });
};

// Simulate dashboard API returning partial/corrupted data
const simulateDashboardAPIFailure = () => {
  const mockDashboardResponse = {
    wallets: null, // null wallets
    positions: undefined, // undefined positions
    tradePnL: {
      // missing statistics field
      total: { netPnL: 'not a number' }, // invalid data type
    },
    transactions: {
      deposits: [], // empty array (valid)
      withdrawals: 'invalid' // invalid type
    }
  };

  // This should not crash
  const walletsData = safeGet(mockDashboardResponse, 'wallets', {});
  const positionsData = safeGet(mockDashboardResponse, 'positions', {});
  const tradePnL = safeNumber(safeGet(mockDashboardResponse, 'tradePnL.total.netPnL'), 0);
  const deposits = safeArray(safeGet(mockDashboardResponse, 'transactions.deposits'));
  const withdrawals = safeArray(safeGet(mockDashboardResponse, 'transactions.withdrawals'));

  console.log('  - Dashboard with corrupted data:', {
    walletsValid: exists(walletsData),
    positionsValid: exists(positionsData),
    tradePnL,
    depositsCount: deposits.length,
    withdrawalsCount: withdrawals.length
  });
};

// Export test scenarios for use in components/tests
export { testScenarios };