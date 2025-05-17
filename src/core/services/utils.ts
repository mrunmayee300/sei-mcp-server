import {
    parseEther,
    formatEther,
    type Address
} from 'viem';

/**
 * Utility functions for formatting and parsing values
 */
export const utils = {
    // Convert ether to wei
    parseEther,

    // Convert wei to ether
    formatEther,

    // Format a bigint to a string
    formatBigInt: (value: bigint): string => value.toString(),

    // Format an object to JSON with bigint handling
    formatJson: (obj: unknown): string => JSON.stringify(obj, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2),

    // Format a number with commas
    formatNumber: (value: number | string): string => {
        return Number(value).toLocaleString();
    },

    // Convert a hex string to a number
    hexToNumber: (hex: string): number => {
        return parseInt(hex, 16);
    },

    // Convert a number to a hex string
    numberToHex: (num: number): string => {
        return '0x' + num.toString(16);
    },

    validateAddress: (address: string): Address => {
        // If it's already a valid Sei 0x address (0x followed by 40 hex chars), return it
        if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return address as Address;
        }

        throw new Error(`Invalid address: ${address}`);
    }
};
