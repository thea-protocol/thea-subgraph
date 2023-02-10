import { TransferSingle, TransferBatch, URI } from './../generated/TheaERC1155/TheaERC1155';
import { Converted, Recovered } from './../generated/BaseTokenManager/BaseTokenManager';
import { ethereum } from '@graphprotocol/graph-ts';
import {
  Retired as RetireEvent,
  Converted as ConvertEvent,
  Recovered as RecoverEvent,
  Unwraped,
} from './../generated/schema';
import { Tokenized, Retired, UpdatedUnwrapRequest } from './../generated/Registry/Registry';
import { createToken, createUser, fetchTheaErc1155, hexToBI, updateBalanceOnTransfer } from './helper';

export function handleTokenized(event: Tokenized): void {
  const theaErc1155 = fetchTheaErc1155();
  theaErc1155.save();
  createUser(event.params.to);

  const token = createToken(event.params.tokenId);
  token.contract = theaErc1155.id;
  // decoding will not fail as project ID is always encoded as string
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const projectId = ethereum.decode('string', event.params.projectIDValue)!;
  token.projectId = projectId.toString();
  token.vintage = hexToBI(event.params.vintageValue.toHexString());
  token.activeAmount = token.activeAmount.plus(event.params.amount);
  token.mintedAmount = token.mintedAmount.plus(event.params.amount);
  token.save();
}

export function handleRetired(event: Retired): void {
  const user = createUser(event.params.from);

  const token = createToken(event.params.id);
  token.activeAmount = token.activeAmount.minus(event.params.amount);
  token.retiredAmount = token.retiredAmount.plus(event.params.amount);
  token.save();

  const retireEvent = new RetireEvent(
    `${token.id}-${event.block.number.toString()}-${event.transaction.index.toString()}`
  );
  retireEvent.by = user.id;
  retireEvent.token = token.id;
  retireEvent.amount = event.params.amount;
  retireEvent.timestamp = event.block.timestamp;
  retireEvent.save();
}

export function handleConverted(event: Converted): void {
  const user = createUser(event.transaction.from);
  const token = createToken(event.params.tokenId);

  const convertEvent = new ConvertEvent(
    `${token.id}-${event.block.number.toString()}-${event.transaction.index.toString()}`
  );
  convertEvent.by = user.id;
  convertEvent.token = token.id;
  convertEvent.amount = event.params.amount;
  convertEvent.timestamp = event.block.timestamp;
  convertEvent.save();
}

export function handleRecovered(event: Recovered): void {
  const owner = createUser(event.params.owner);
  const token = createToken(event.params.tokenId);

  const recoverEvent = new RecoverEvent(
    `${token.id}-${event.block.number.toString()}-${event.transaction.index.toString()}`
  );
  recoverEvent.by = owner.id;
  recoverEvent.token = token.id;
  recoverEvent.amount = event.params.amount;
  recoverEvent.timestamp = event.block.timestamp;
  recoverEvent.save();
}

export function handleTransferSingle(event: TransferSingle): void {
  const token = createToken(event.params.id);
  updateBalanceOnTransfer(event.params.from, event.params.to, token.id, event.params.value);
}

export function handleTransferBatch(event: TransferBatch): void {
  const tokenIds = event.params.ids;
  const amounts = event.params.values;
  for (let i = 0; i < tokenIds.length; i++) {
    const token = tokenIds[i];
    const amount = amounts[i];
    updateBalanceOnTransfer(event.params.from, event.params.to, token.toString(), amount);
  }
}

export function handleURI(event: URI): void {
  const theaErc1155 = fetchTheaErc1155();
  theaErc1155.baseURI = event.params.value;
  theaErc1155.save();
}

export function handleUnwrap(event: UpdatedUnwrapRequest): void {
  const user = createUser(event.params.owner);
  const token = createToken(event.params.id);
  token.activeAmount = token.activeAmount.minus(event.params.amount);
  token.unwrappedAmount = token.unwrappedAmount.plus(event.params.amount);
  token.save();

  const unwrapEvent = new Unwraped(
    `${token.id}-${event.block.number.toString()}-${event.transaction.index.toString()}`
  );
  unwrapEvent.by = user.id;
  unwrapEvent.token = token.id;
  unwrapEvent.amount = event.params.amount;
  unwrapEvent.timestamp = event.block.timestamp;
  unwrapEvent.save();
}
