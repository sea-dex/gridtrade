'use client';

import type { Account, Address, Chain, Client, Hash, Transport } from 'viem';
import { prepareAuthorization } from 'viem/actions';
import { execute } from 'viem/experimental/erc7821';

export async function executeErc7702Batch({
  walletClient,
  account,
  executorAddress,
  calls,
}: {
  walletClient: Client<Transport, Chain | undefined, Account | undefined>;
  account: Address;
  executorAddress: Address;
  calls: readonly unknown[];
}): Promise<Hash> {
  const authorization = await prepareAuthorization(walletClient, {
    account,
    address: executorAddress,
    executor: 'self',
  });

  return execute(walletClient, {
    account,
    address: account,
    authorizationList: [authorization],
    chain: walletClient.chain,
    calls: calls as never,
  });
}

export function isErc7702FallbackError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();

  return [
    name,
    message,
  ].some((value) =>
    value.includes('methodnotfoundrpcerror') ||
    value.includes('methodnotsupportedrpcerror') ||
    value.includes('invalidparamsrpcerror') ||
    value.includes('invalidinputrpcerror') ||
    value.includes('executeunsupportederror') ||
    value.includes('unsupportedexecutionmode') ||
    value.includes('authorizationlist') ||
    value.includes('eip-7702') ||
    value.includes('eip7702') ||
    value.includes('erc-7821') ||
    value.includes('erc7821'),
  );
}
