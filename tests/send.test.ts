import { describe, it, expect, vi } from "vitest";
import nacl from "tweetnacl";

import { KeyManager } from "@pokt-foundation/pocketjs-signer";
import { JsonRpcProvider } from "@pokt-foundation/pocketjs-provider";
import { TransactionBuilder } from "@pokt-foundation/pocketjs-transaction-builder";

import {
  createSendMessage,
  createTransaction,
  getAddressFromPublicKey,
} from "../src/pocket";

const secretKeySample =
  "00000000000000000000000000000000000000000000000000000000000000003b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29";

const receiverAddress = "12345f4e714bc280c2c8f5bcb89b153ab5f09f56";
const sendAmount = "1000000";

const DEFAULT_BASE_FEE = "15000";

describe("compatibility test", () => {
  // we need to mock Math.random in order to entropy match
  const mocked = vi.fn(() => 0.1);
  Math.random = mocked;

  it("create signed tx", async () => {
    const { publicKey } = await nacl.sign.keyPair.fromSecretKey(
      Buffer.from(secretKeySample, "hex")
    );
    const address = getAddressFromPublicKey(publicKey);
    const message = createSendMessage(address, receiverAddress, sendAmount);

    // PNF way
    const provider = new JsonRpcProvider({
      rpcUrl: "",
    });

    const signer = await KeyManager.fromPrivateKey(secretKeySample);

    expect(signer.address).toBe(address);


    const builder = new TransactionBuilder({
      signer,
      provider,
    });

    const messagepnf = builder.send({
      fromAddress: signer.address,
      toAddress: receiverAddress,
      amount: sendAmount,
    });

    expect(message.toStdSignDocMsgObj()).toEqual(
      messagepnf.toStdSignDocMsgObj()
    );

    expect(message.toStdTxMsgObj()).toEqual(messagepnf.toStdTxMsgObj());

    const tx = createTransaction(
      message,
      DEFAULT_BASE_FEE,
      "",
      secretKeySample
    );

    const txPnfWrapper = await builder.createTransaction({
      fee: DEFAULT_BASE_FEE,
      memo: "",
      txMsg: messagepnf,
    });

    const txPnf = txPnfWrapper.toJSON();

    expect(txPnf.address).toBe(tx.address);

    expect(txPnf.raw_hex_bytes).toBe(tx.raw_hex_bytes);
  });
});
