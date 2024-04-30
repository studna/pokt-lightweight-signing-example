/* eslint @typescript-eslint/no-unused-vars: 0 */
import { Buffer } from 'buffer';
import nacl from 'tweetnacl';

import { ProtoStdSignature, ProtoStdTx } from './generated/signer';
import { varintEncode } from './varintEncode';
import { MsgProtoSend } from './MsgProtoSend';

import createHash from 'create-hash';

export function getAddressFromPublicKey(publicKey: Buffer | Uint8Array): string {
  return createHash('sha256').update(publicKey).digest().toString('hex').slice(0, 40);
}

export function isAddressValid(address: string): boolean {
  // simple validation of 40 hex characters
  return /^[0-9a-fA-F]{40}$/.test(address);
}

export function createSendMessage(from: string, to: string, amount: string): MsgProtoSend {
  return new MsgProtoSend(from, to, amount);
}

// new MsgProtoSend(signerAddress, request.to, request.amount.toString())

export function createTransaction(msg: MsgProtoSend, fee: string, memo: string, secretKeyHex: string) {

  const { publicKey, secretKey } = nacl.sign.keyPair.fromSecretKey(Buffer.from(secretKeyHex, 'hex'));

  const entropy = Number(BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)).toString()).toString();

  // important! we need to keep the order of the fields in the object
  const docToSign = {
    chain_id: 'mainnet',
    entropy: entropy,
    fee: [
      {
        amount: fee,
        denom: 'upokt',
      },
    ],
    memo,
    msg: msg.toStdSignDocMsgObj(),
  };

  const bytesToSign = Buffer.from(JSON.stringify(docToSign), 'utf-8');

  const signatureBytes = nacl.sign.detached(bytesToSign, secretKey);

  const txSig: ProtoStdSignature = {
    publicKey: publicKey,
    Signature: signatureBytes,
  };

  const stdTx: ProtoStdTx = {
    msg: msg.toStdTxMsgObj(),
    fee: docToSign.fee,
    signature: txSig,
    memo: docToSign.memo,
    entropy: parseInt(docToSign.entropy, 10),
  };

  // Create the Proto Std Tx bytes
  const protoStdTxBytes: Buffer = Buffer.from(ProtoStdTx.encode(stdTx).finish());

  // Create the prefix
  const prefixBytes = varintEncode(protoStdTxBytes.length);
  const prefix = Buffer.from(prefixBytes);

  // Concatenate for the result
  const rawHexBytes = Buffer.concat([prefix, protoStdTxBytes]).toString('hex');

  return {
    address: getAddressFromPublicKey(publicKey),
    raw_hex_bytes: rawHexBytes,
  };
}