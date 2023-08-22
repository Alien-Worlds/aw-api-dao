import * as AlienWorldsCommon from '@alien-worlds/aw-contract-alien-worlds';
import { Api, JsonRpc } from 'eosjs';
import fetch from 'node-fetch';

import {
  inject,
  injectable,
  Result,
  UnknownObject,
  UseCase,
} from '@alien-worlds/aw-core';
import { UnPackedTransaction } from '../models/unpacked-transaction';

/** The AccountAuthorization is a common structure used in actions to specify which account and associated authority is to perform a given action. The most common used AccountAuthorization will be the `active` permission for an account - often seen as `permission@actor` eg. `active@bob` */
export interface AccountAuthorization {
  actor: string;
  permission: string;
}

/** This is the basic form that any action requires to be pushed to the blockchain. These can be grouped together into a transaction to facilitate performing a group of actions within one atomic transaction that either all succeed or all fail - no half way. Any combination of actions pushing to different contracts can be bundled into one transaction which give tremendous power to be able to perform grouped actions without leaving the blockchain logic in a partial state. eg. A transaction may require a deposit of funds to one account, an action to check the deposit followed by another action to confirm some logic and mint an NFT. By having all of these within one transaction even if the final minting of the NFT fails for some reason everything back to the initial deposit will be reversed and leave the blockchain in a stable state. */
export type AntelopeAction = {
  /** The account holding the contract with the action intended to execute eg. `eosio.token` */
  account: string;
  /** The name of the action to executed eg. `transfer` */
  name: string;
  /** The authorizations intended to perform this action. This should be authorised for that account either via the default `active` permission or via a custom auth that has been linked to an action with `linkauth` */
  authorization: AccountAuthorization[];
  /** The data required to perform the action. These will be the action sepcific params supplied in a JSON format */
  data: UnknownObject;
};

export type ResourcePayer = {
  payer: string;
  max_cpu_us: number;
  max_net_bytes: number;
  max_memory_bytes: number;
};

export type Transaction = {
  actions: AntelopeAction[];
  expiration?: string;
  ref_block_num?: number;
  ref_block_prefix?: number;
  max_net_usage_words?: number;
  max_cpu_usage_ms?: number;
  delay_sec?: number;
  context_free_actions?: AntelopeAction[];
  context_free_data?: Uint8Array[];
  transaction_extensions?: [number, string][];
  resource_payer?: ResourcePayer;
};

/**
 * The `GetDacTreasuryUseCase` class represents a use case for fetching DAC treasury information from the Alien Worlds smart contract.
 * @class
 */
@injectable()
export class GetDecodedMSIGTxnUseCase implements UseCase<UnPackedTransaction> {
  public static Token = 'GET_DECODED_MSIG_USE_CASE';

  /**
   * Creates an instance of the `GetDacTreasuryUseCase` use case with the specified dependencies.
   * @param {AlienWorldsCommon.Services.AlienWorldsContractService} alienWorldsContractService - The service for interacting with the Alien Worlds smart contract.
   */
  constructor(
    @inject(AlienWorldsCommon.Services.AlienWorldsContractService.Token)
    private alienWorldsContractService: AlienWorldsCommon.Services.AlienWorldsContractService
  ) {}

  /**
   * Executes the use case to fetch DAC treasury information from the Alien Worlds smart contract.
   * @async
   * @param {string} account - The account name of the DAC treasury for which to fetch the information.
   * @returns {Promise<Result<AlienWorldsCommon.Deltas.Entities.Accounts>>} - The result of the use case operation containing the fetched DAC treasury information.
   */
  public async execute(
    packedTxn: string
  ): Promise<Result<UnPackedTransaction>> {
    try {
      const rpc = new JsonRpc('https://wax.eosdac.io', { fetch });

      const api = new Api({
        rpc,
        signatureProvider: null,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
      });

      // First unpack the serialised transaction from within within each proposal row.
      const hex = Uint8Array.from(Buffer.from(packedTxn, 'hex'));
      const unserialisedTxn = api.deserializeTransaction(hex);
      // Each deserialised transaction will still have actions with encoded data which need to be further deserialised.
      // The deserialising of actions is asynchronous because internally it fetches (and caches) the ABI from the blockchain for each contract
      // action so that is can be deserialised.
      const actions = await api.deserializeActions(unserialisedTxn.actions);
      const unsTxn = {
        ...unserialisedTxn,
        actions,
      };

      return Result.withContent(UnPackedTransaction.create(unsTxn));
    } catch (error) {
      return Result.withFailure(error);
    }
  }
}
