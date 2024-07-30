# ⚠️ Archive Notice ⚠️

**This repo has been archived!**

This repository was built for Hyperlane v2 and has not been updated to work with the latest Hyperlane version, v3.

See the [Hyperlane Docs](https://docs.hyperlane.xyz) for information on building applications using Hyperlane v3.

# Hyperlane Quickstart

This repo contains example code that can be easily understood and modified. It should help you familiarize yourself with how to use the Hyperlane APIs to build your cross-chain application. Hyperlane offers several APIs: The Messaging API lets you send arbitrary bytes from a sender contract on the origin chain to a receiver contract on the destination chain. The accounts API lets senders specify abi-encoded Calls that can be executed from a sender's Interchain Account (ICA) on the destination chain. The Queries API allows you to make remote view calls with built-in callbacks without the need to deploy remote contracts. We built this quickstart with both Hardhat and Foundry in mind, so feel free to jump to the relevant sections.

## Setup

```shell
$ yarn install
```

## Hardhat

We have both unit tests as well as hardhat tasks that show you how to develop on top of the Hyperlane APIs. To interact with the hardhat tasks on remote networks, you will need to add a private key configuration. Those keys need to have funds as well, we can recommend the Paradigm faucet at [https://faucet.paradigm.xyz](https://faucet.paradigm.xyz).

When accounts are ready, start up building with hardhat, or see the `package.json` scripts for a set of common commands:

```shell
$ yarn hardhat compile
```

### Direct Messaging API

If you just want to get started with sending a message, you can use the `send-message` task to send a message to a pre-deployed `TestRecipient`:

```shell
$ yarn hardhat send-message --network goerli --remote mumbai --message "Your Message"
```

(Any Hyperlane-supported chain name can be used)

### Deploy Sender and Receiver contracts

Now that you know how easy and quick sending Hyperlane messages are, you can deploy a sending and receiving contract. You can use the predefined `HyperlaneMessageSender/Receiver` contracts and tasks to get started:

```shell
# Deploys the sender
$ yarn hardhat deploy-message-sender --network mumbai

# Deploys the receiver
$ yarn hardhat deploy-message-receiver --network goerli --origin mumbai

# Send a message via the sender contract to the receiver contract
$ yarn hardhat send-message-via-HyperlaneMessageSender --sender "SENDER_ADDRESS" --receiver "RECEIVER_ADDRESS" --remote goerli --network mumbai --message "Your message"
```

### Accounts API

If you do not want to build a custom serialization format for your messages, you can also just use the Accounts API to make abi-encoded function calls from Interchain Accounts which are universal across chains for a given sender address on an origin chain. ICAs are identity proxy contracts which only accept calls from their designated owner on the origin chain. Thanks to the awesomness of CREATE2, calls can be referenced before they are deployed! This allows contracts on the destination chain with no custom Hyperlane or cross-chain logic to be interacted with from a remote chain!

To demonstrate this, look at this simple `Ownee` contract:

```solidity
contract Ownee is OwnableUpgradeable {
  uint256 public fee = 0;

  event NewFeeSet(uint256 newFee);
  
  constructor(address owner) {
    _transferOwnership(owner);
  }

  function setFee(uint256 newFee) onlyOwner external {
    fee = newFee;
  }
}
```

We can have it be owned by a simple `Owner` contract that lives on a remote chain. First, let's deploy it:

```shell
$ yarn hardhat deploy-owner --network goerli
```

Let's get the ICA account address for this contract:


```shell
$ yarn hardhat get-ica-address --network goerli --address "OWNER_ADDRESS"
```

We can now deploy a (cross-chain-oblivious) `Ownee` contract on a remote chain:

```shell
$ yarn hardhat deploy-ownee --owner "OWNER_ICA_ADDRESS" --network mumbai
```

We can now invoke the `setRemoteFee` function on the `Owner`:

```shell
$ yarn hardhat set-remote-fee --owner "OWNER_ADDRESS" --ownee "OWNEE_ADDRESS" --network goerli --remote mumbai --newFee 42
```

After a short bit, you should be able to see that the value was set, without needing to do anything on the remote chain!

```shell
$ yarn hardhat get-fee --ownee "OWNEE_ADDRESS" --network mumbai
```

### Queries API

What if you want to read instead of write across-chains. The Queries API is what you are looking for. The Queries API allows you to make a view call on another chain and get the result in a separate callback.

To demonstrate this, lets look at this simple OwnerReader.contract:

```solidity
contract OwnerReader {
    IInterchainQueryRouter router;

    address lastTarget;
    address lastOwner;

    constructor(address _router) {
        router = IInterchainQueryRouter(_router);
    }

    function readRemoteOwner(uint32 _destinationDomain, address target)
        external
    {
        router.query(
            _destinationDomain,
            Call({to: target, data: abi.encodePacked(Ownable.owner.selector)}),
            abi.encode(this.receiveQueryResult.selector, target)
        );
    }

    function receiveQueryResult(address _target, address _owner) public {
        lastOwner = _owner;
        lastTarget = _target;
    }
}
```

We can deploy it with:

```shell
$ yarn hardhat deploy-reader --network goerli
```

Once deployed, you can have the contract make a query to read a remote owner. In this case, you can read the owner of a deployed `Owner` contract above:

```shell
$ yarn hardhat read-remote-owner  --reader "READER_ADDRESS" --remote fuji --target "OWNEE_ADDRESS" --network goerli
```

You can then read the query result via:

```shell
$ yarn hardhat get-query-result --reader "READER_ADDRESS" --network goerli
```


## Foundry

_More details coming soon_
