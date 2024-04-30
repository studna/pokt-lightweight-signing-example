# Pocket Network - Lightweight Tx Signing Example

Utilizing `@pokt-foundation/*` libraries may present challenges in native applications or require unnecessary audits due to it's dependencies.

This showcase demonstrates how to generate signed transaction data using lightweight dependencies:

- tweetnacl
- long
- protobufjs
- create-hash (optional, you can use Node.js crypto)


# Submit txdata to /v1/client/rawtx

```js
const POCKET_RPC_ENDPOINT = 'yourPocketRpcHost';

const { publicKey } = await nacl.sign.keyPair.fromSecretKey(
    Buffer.from(secretKeySample, "hex")
);

const address = getAddressFromPublicKey(publicKey);

if(!isAddressValid(receiverAddress)) {
    throw new Error('Invalid address');
}

const message = createSendMessage(address, receiverAddress, sendAmount);

const txdata = createTransaction(
    message,
    DEFAULT_BASE_FEE,
    "",
    secretKeySample
);

const res = fetch(`${POCKET_RPC_ENDPOINT}/v1/client/rawtx`, {
      method: 'POST',
      body: JSON.stringify(txdata),
});

const data = await res.json();

return data.txhash;
```

![image](https://github.com/studna/pokt-lightweight-signing-example/assets/939784/d14e7444-4794-4edc-b535-d884f603b888)
