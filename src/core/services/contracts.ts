import {
  type Hash,
  type Hex,
  type ReadContractParameters,
  type GetLogsParameters,
  type Log
} from 'viem';
import { getPublicClient, getWalletClient } from './clients.js';
import * as services from "./index.js";

/**
 * Read from a contract for a specific network
 */
export async function readContract(params: ReadContractParameters, network = 'sei') {
  const client = getPublicClient(network);
  return await client.readContract(params);
}

/**
 * Write to a contract for a specific network
 */
export async function writeContract(
  privateKey: Hex,
  params: Record<string, any>,
  network = 'sei'
): Promise<Hash> {
  const client = getWalletClient(privateKey, network);
  return await client.writeContract(params as any);
}

/**
 * Get logs for a specific network
 */
export async function getLogs(params: GetLogsParameters, network = 'sei'): Promise<Log[]> {
  const client = getPublicClient(network);
  return await client.getLogs(params);
}

/**
 * Check if an address is a contract
 * @param address Address
 * @param network Network name or chain ID
 * @returns True if the address is a contract, false if it's an EOA
 */
export async function isContract(address: string, network = 'sei'): Promise<boolean> {
  const validatedAddress = services.helpers.validateAddress(address);

  const client = getPublicClient(network);
  const code = await client.getBytecode({ address: validatedAddress });
  return code !== undefined && code !== '0x';
}
