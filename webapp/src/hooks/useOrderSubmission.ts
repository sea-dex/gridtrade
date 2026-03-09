'use client';

import { useCallback, useState } from 'react';
import type { Address, Hash, PublicClient } from 'viem';
import { zeroAddress } from 'viem';
import { useConnectorClient, usePublicClient } from 'wagmi';
import type { UseWriteContractReturnType } from 'wagmi';
import type { TxStep } from '@/components/trading/TransactionStatusDialog';
import { ERC20_ABI } from '@/config/abi/ERC20';
import { GRIDEX_ABI } from '@/config/abi/GridEx';
import { GRID_7702_EXECUTOR_ADDRESSES } from '@/config/chains';
import { executeErc7702Batch, isErc7702FallbackError } from '@/lib/erc7702';

type SubmitStage = 'idle' | 'approving_base' | 'approving_quote' | 'placing';
type ApprovalStage = Exclude<SubmitStage, 'idle' | 'placing'>;
type TransactionReceipt = Awaited<ReturnType<PublicClient['waitForTransactionReceipt']>>;

interface ApprovalRequirement {
  currentAllowance: bigint;
  enabled: boolean;
  requiredAmount: bigint;
  stage: ApprovalStage;
  symbol: string;
  tokenAddress: Address;
}

interface PlaceRequest {
  args: readonly unknown[];
  functionName: 'placeETHGridOrders' | 'placeGridOrders';
  value?: bigint;
}

interface SubmitOrderOptions {
  address: Address;
  baseApproval: ApprovalRequirement;
  buildPlaceRequest: () => PlaceRequest;
  gridexAddress: Address;
  onPlaceSuccess?: (receipt: TransactionReceipt) => Promise<void> | void;
  quoteApproval: ApprovalRequirement;
}

interface UseOrderSubmissionParams {
  chainId?: number;
  t: (key: string) => string;
  writeContractAsync: UseWriteContractReturnType['writeContractAsync'];
}

export function useOrderSubmission({
  chainId,
  t,
  writeContractAsync,
}: UseOrderSubmissionParams) {
  const publicClient = usePublicClient({ chainId });
  const { data: connectorClient } = useConnectorClient({ chainId });

  const [submitStage, setSubmitStage] = useState<SubmitStage>('idle');
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txSteps, setTxSteps] = useState<TxStep[]>([]);
  const [txError, setTxError] = useState<string | null>(null);

  const updateStep = useCallback(
    (index: number, patch: Partial<TxStep>) =>
      setTxSteps((prev) => prev.map((step, currentIndex) => (
        currentIndex === index ? { ...step, ...patch } : step
      ))),
    [],
  );

  const closeTxDialog = useCallback(() => {
    setTxDialogOpen(false);
  }, []);

  const waitForSuccessfulReceipt = useCallback(
    async (hash: Hash) => {
      if (!publicClient) {
        throw new Error('Missing public client');
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') {
        throw new Error('Transaction reverted');
      }

      return receipt;
    },
    [publicClient],
  );

  const submitOrder = useCallback(
    async ({
      address,
      baseApproval,
      buildPlaceRequest,
      gridexAddress,
      onPlaceSuccess,
      quoteApproval,
    }: SubmitOrderOptions) => {
      const needsBase = baseApproval.enabled && baseApproval.currentAllowance < baseApproval.requiredAmount;
      const needsQuote = quoteApproval.enabled && quoteApproval.currentAllowance < quoteApproval.requiredAmount;
      const erc7702Executor = chainId ? GRID_7702_EXECUTOR_ADDRESSES[chainId] : undefined;
      const shouldTryErc7702 = !!erc7702Executor && !!connectorClient;
      const hasApprovalSteps = needsBase || needsQuote;

      if (shouldTryErc7702) {
        console.info('[ERC-7702] attempting batch submission', {
          chainId,
          executorAddress: erc7702Executor,
          hasApprovalSteps,
          needsBase,
          needsQuote,
        });
      } else {
        console.info('[ERC-7702] skipped batch submission', {
          chainId,
          hasConnectorClient: !!connectorClient,
          hasExecutorAddress: !!erc7702Executor,
          hasApprovalSteps,
          reason: !erc7702Executor
            ? 'missing_executor_address'
            : !connectorClient
              ? 'missing_connector_client'
              : 'unknown',
        });
      }

      const setupSteps = (useBatch: boolean) => {
        const steps: TxStep[] = [];
        const stepIndexMap = { approveBase: -1, approveQuote: -1, place: -1 };

        if (useBatch) {
          stepIndexMap.place = 0;
          steps.push({
            label: hasApprovalSteps ? t('tx_dialog.approve_and_place') : t('tx_dialog.place_order'),
            status: 'pending',
          });
        } else {
          if (needsBase) {
            stepIndexMap.approveBase = steps.length;
            steps.push({
              label: t('tx_dialog.approve_base').replace('{{symbol}}', baseApproval.symbol),
              status: 'pending',
            });
          }

          if (needsQuote) {
            stepIndexMap.approveQuote = steps.length;
            steps.push({
              label: t('tx_dialog.approve_quote').replace('{{symbol}}', quoteApproval.symbol),
              status: 'pending',
            });
          }

          stepIndexMap.place = steps.length;
          steps.push({
            label: t('tx_dialog.place_order'),
            status: 'pending',
          });
        }

        setTxSteps(steps);
        setTxError(null);
        setTxDialogOpen(true);
        return stepIndexMap;
      };

      let stepIndexMap = setupSteps(shouldTryErc7702);

      const approveIfNeeded = async (
        approval: ApprovalRequirement,
        stepIdx: number,
      ) => {
        if (!publicClient) {
          throw new Error('Missing public client');
        }

        if (!approval.enabled) return;
        if (approval.tokenAddress === zeroAddress) return;
        if (approval.requiredAmount <= 0n) return;
        if (approval.currentAllowance >= approval.requiredAmount) return;

        setSubmitStage(approval.stage);
        updateStep(stepIdx, { status: 'active' });

        if (approval.currentAllowance > 0n) {
          const resetHash = await writeContractAsync({
            abi: ERC20_ABI,
            address: approval.tokenAddress,
            args: [gridexAddress, 0n],
            functionName: 'approve',
          });
          updateStep(stepIdx, { hash: resetHash });
          await waitForSuccessfulReceipt(resetHash);
        }

        const approveHash = await writeContractAsync({
          abi: ERC20_ABI,
          address: approval.tokenAddress,
          args: [gridexAddress, approval.requiredAmount],
          functionName: 'approve',
        });
        updateStep(stepIdx, { hash: approveHash });
        await waitForSuccessfulReceipt(approveHash);
        updateStep(stepIdx, { status: 'done' });
      };

      try {
        const placeRequest = buildPlaceRequest();

        if (shouldTryErc7702 && connectorClient && erc7702Executor) {
          try {
            setSubmitStage('placing');
            updateStep(stepIndexMap.place, { status: 'active' });

            const calls: Array<{
              abi: typeof ERC20_ABI | typeof GRIDEX_ABI;
              args: readonly unknown[];
              functionName: string;
              to: Address;
              value?: bigint;
            }> = [];

            const pushApproveCalls = (approval: ApprovalRequirement) => {
              if (!approval.enabled) return;
              if (approval.tokenAddress === zeroAddress) return;
              if (approval.requiredAmount <= 0n || approval.currentAllowance >= approval.requiredAmount) return;

              if (approval.currentAllowance > 0n) {
                calls.push({
                  abi: ERC20_ABI,
                  args: [gridexAddress, 0n],
                  functionName: 'approve',
                  to: approval.tokenAddress,
                });
              }

              calls.push({
                abi: ERC20_ABI,
                args: [gridexAddress, approval.requiredAmount],
                functionName: 'approve',
                to: approval.tokenAddress,
              });
            };

            pushApproveCalls(baseApproval);
            pushApproveCalls(quoteApproval);

            calls.push({
              abi: GRIDEX_ABI,
              args: placeRequest.args,
              functionName: placeRequest.functionName,
              to: gridexAddress,
              value: placeRequest.value,
            });

            const txHash = await executeErc7702Batch({
              walletClient: connectorClient,
              account: address,
              executorAddress: erc7702Executor,
              calls,
            });

            console.info('[ERC-7702] batch submission sent', {
              chainId,
              txHash,
            });
            updateStep(stepIndexMap.place, { hash: txHash, status: 'active' });
            const receipt = await waitForSuccessfulReceipt(txHash);
            await onPlaceSuccess?.(receipt);
            console.info('[ERC-7702] batch submission confirmed', {
              chainId,
              txHash,
            });
            updateStep(stepIndexMap.place, { status: 'done' });
            return;
          } catch (erc7702Error) {
            if (!isErc7702FallbackError(erc7702Error)) {
              throw erc7702Error;
            }

            console.warn('[ERC-7702] batch submission fallback to standard flow', {
              chainId,
              error: erc7702Error instanceof Error ? erc7702Error.message : String(erc7702Error),
            });
            stepIndexMap = setupSteps(false);
          }
        }

        if (stepIndexMap.approveBase >= 0) {
          await approveIfNeeded(baseApproval, stepIndexMap.approveBase);
        }

        if (stepIndexMap.approveQuote >= 0) {
          await approveIfNeeded(quoteApproval, stepIndexMap.approveQuote);
        }

        setSubmitStage('placing');
        updateStep(stepIndexMap.place, { status: 'active' });

        const writeRequest = {
          abi: GRIDEX_ABI,
          address: gridexAddress,
          args: placeRequest.args,
          functionName: placeRequest.functionName,
          ...(placeRequest.functionName === 'placeETHGridOrders'
            ? { value: placeRequest.value ?? 0n }
            : {}),
        } as Parameters<typeof writeContractAsync>[0];

        const txHash = await writeContractAsync(writeRequest);

        updateStep(stepIndexMap.place, { hash: txHash, status: 'active' });
        const receipt = await waitForSuccessfulReceipt(txHash);
        await onPlaceSuccess?.(receipt);
        updateStep(stepIndexMap.place, { status: 'done' });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Transaction failed';
        setTxError(message);
        setTxSteps((prev) => prev.map((step) => (
          step.status === 'active' ? { ...step, status: 'error' } : step
        )));
      } finally {
        setSubmitStage('idle');
      }
    },
    [chainId, connectorClient, publicClient, t, updateStep, waitForSuccessfulReceipt, writeContractAsync],
  );

  return {
    closeTxDialog,
    isSubmitting: submitStage !== 'idle',
    submitOrder,
    txDialogOpen,
    txError,
    txSteps,
  };
}
