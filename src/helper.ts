import { address, integer } from '@protofire/subgraph-toolkit';
import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { TheaERC1155, TheaERC1155Balance, Token, User } from '../generated/schema';

const THEA_ERC1155 = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

export function createUser(address: Address): User {
  let user = User.load(address.toHex());
  if (user === null) {
    user = new User(address.toHex());
    user.save();
  }
  return user;
}

export function fetchTheaErc1155(): TheaERC1155 {
  let theaErc1155 = TheaERC1155.load(THEA_ERC1155);
  if (theaErc1155 === null) {
    theaErc1155 = new TheaERC1155(THEA_ERC1155);
    theaErc1155.baseURI = '';
  }
  return theaErc1155;
}

export function createToken(tokenId: BigInt): Token {
  const theaErc1155 = fetchTheaErc1155();
  let token = Token.load(tokenId.toString());
  if (token === null) {
    token = new Token(tokenId.toString());
    token.tokenURI = `${theaErc1155.baseURI}${tokenId.toString()}.json`;
    token.activeAmount = integer.ZERO;
	token.mintedAmount = integer.ZERO;
	token.retiredAmount = integer.ZERO;
	token.unwrappedAmount = integer.ZERO;
  }
  return token;
}

export function createTheaErc1155Balance(user: string, tokenId: string): TheaERC1155Balance {
  let theaErc1155Balance = TheaERC1155Balance.load(user.concat('-').concat(tokenId));
  if (theaErc1155Balance === null) {
    theaErc1155Balance = new TheaERC1155Balance(user.concat('-').concat(tokenId));
    theaErc1155Balance.token = tokenId;
    theaErc1155Balance.owner = user;
    theaErc1155Balance.amount = integer.ZERO;
  }
  return theaErc1155Balance;
}

export function updateBalanceOnTransfer(from: Address, to: Address, tokenId: string, amount: BigInt): void {
  if (!address.isZeroAddress(from)) {
    const fromUser = createUser(from);
    const fromBalance = createTheaErc1155Balance(fromUser.id, tokenId);
    fromBalance.amount = fromBalance.amount.minus(amount);
    fromBalance.save();
  }

  if (!address.isZeroAddress(to)) {
    const toUser = createUser(to);
    const toBalance = createTheaErc1155Balance(toUser.id, tokenId);
    toBalance.amount = toBalance.amount.plus(amount);
    toBalance.save();
  }
}

export function hexToBI(hexString: string): BigInt {
  return BigInt.fromUnsignedBytes(changetype<Bytes>(Bytes.fromHexString(hexString).reverse()));
}

