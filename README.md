# Hyperlane Quickstart

This repo contains example code that can be easily understood and modified. It should help you familiarize yourself with how to use the Hyperlane APIs to build your cross-chain application. Hyperlane offers two APIs: The lower-level Messaging API and the higher-level Accounts API. The Messaging API lets you send arbitrary bytes from a sender contract on the origin chain to a receiver contract on the destination chain. The accounts API lets senders specify abi-encoded Calls that can be executed from a sender's Interchain Account (ICA) on the destination chain. We built this quickstart with both Hardhat and Foundry in mind, so feel free to jump to the relevant sections.

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

## Foundry

_More details coming soon_
