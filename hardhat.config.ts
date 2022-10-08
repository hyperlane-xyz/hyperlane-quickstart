import { HardhatUserConfig, task, types } from "hardhat/config";
import {
  chainConnectionConfigs,
  ChainNameToDomainId,
  MultiProvider,
  objMap,
} from "@hyperlane-xyz/sdk";
import { utils } from "@hyperlane-xyz/utils";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import { environments } from "@hyperlane-xyz/sdk/dist/consts/environments";

const accounts = [
  "PRIVATE_KEY",
];
const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: objMap(chainConnectionConfigs, (_chain, cc) => ({
    // @ts-ignore
    url: cc.provider.connection.url,
    accounts,
  })),
  etherscan: {
    apiKey: {
      // Your etherscan API keys here
      // polygonMumbai: "",
      // goerli: "",
    },
  },
};

const hyperlaneCoreAddresses = objMap(
  { ...environments.testnet2, ...environments.mainnet },
  (_chain, addresses) => ({
    outbox: addresses.outbox.proxy,
    connectionManager: addresses.connectionManager,
    interchainGasPaymaster: addresses.interchainGasPaymaster.proxy,
    inboxes: objMap(
      // @ts-ignore
      addresses.inboxes,
      (_remoteChain, inboxAddresses) => inboxAddresses.inbox.proxy
    ),
  })
);

const multiProvider = new MultiProvider(chainConnectionConfigs);

const OUTBOX_ABI = [
  "function dispatch(uint32 destinationDomain, bytes32 recipient, bytes calldata message) returns (uint256)",
];
const INTERCHAIN_ACCOUNT_ROUTER_ABI = [
  "function dispatch(uint32 _destinationDomain, (address, bytes)[] calldata calls)",
];
const TESTRECIPIENT_ABI = [
  "function fooBar(uint256 amount, string calldata message)",
];

task("send-message", "sends a message")
  .addParam(
    "remote",
    "The name of the destination chain of this message",
    undefined,
    types.string,
    false
  )
  .addParam("message", "the message you want to send", "Hello World")
  .setAction(async (taskArgs, hre) => {
    const signer = (await hre.ethers.getSigners())[0];
    const recipient = "0xBC3cFeca7Df5A45d61BC60E7898E63670e1654aE";
    const origin = hre.network.name;
    const remote = taskArgs.remote;
    const remoteDomain = ChainNameToDomainId[remote];
    const outboxC = hyperlaneCoreAddresses[origin].outbox;

    const outbox = new hre.ethers.Contract(outboxC, OUTBOX_ABI, signer);
    console.log(
      `Sending message "${taskArgs.message}" from ${hre.network.name} to ${taskArgs.remote}`
    );

    const tx = await outbox.dispatch(
      remoteDomain,
      utils.addressToBytes32(recipient),
      hre.ethers.utils.arrayify(hre.ethers.utils.toUtf8Bytes(taskArgs.message))
    );

    await tx.wait();
    console.log(
      `Send message at txHash ${tx.hash}. Check the debugger at https://explorer.hyperlane.xyz`
    );

    const recipientUrl = await multiProvider
      .getChainConnection(remote)
      .getAddressUrl(recipient);
    console.log(
      `Check out the explorer page for recipient ${recipientUrl}#events`
    );
  });

task("make-ica-call", "Makes an Interchain Account call")
  .addParam(
    "remote",
    "The name of the remote chain as the destination of this message",
    undefined,
    types.string,
    false
  )
  .addParam("message", "the message you want to send", "Hello World")
  .setAction(async (taskArgs, hre) => {
    const signer = (await hre.ethers.getSigners())[0];
    const recipient = "0xBC3cFeca7Df5A45d61BC60E7898E63670e1654aE";
    const interchainAccountAddress =
      "0x28DB114018576cF6c9A523C17903455A161d18C4";
    const remote = taskArgs.remote;
    const remoteDomain = ChainNameToDomainId[remote];
    // Arbitrary values
    const amount = 42;

    const interchainAccountRouter = new hre.ethers.Contract(
      interchainAccountAddress,
      INTERCHAIN_ACCOUNT_ROUTER_ABI,
      signer
    );

    const recipientInterface = new hre.ethers.utils.Interface(
      TESTRECIPIENT_ABI
    );
    const calldata = recipientInterface.encodeFunctionData("fooBar", [
      amount,
      taskArgs.message,
    ]);

    console.log(
      `Sending message "${taskArgs.message}" from ${hre.network.name} to ${taskArgs.remote}`
    );

    const tx = await interchainAccountRouter.dispatch(remoteDomain, [
      [recipient, calldata],
    ]);
    console.log(
      `Sent message at txHash ${tx.hash}. Check the debugger at https://explorer.hyperlane.xyz`
    );

    await tx.wait();

    const recipientUrl = await multiProvider
      .getChainConnection(remote)
      .getAddressUrl(recipient);
    console.log(
      `Check out the explorer page for recipient ${recipientUrl}#events`
    );
  });

task(
  "deploy-message-sender",
  "deploys the HyperlaneMessageSender contract"
).setAction(async (taskArgs, hre) => {
  console.log(`Deploying HyperlaneMessageSender on ${hre.network.name}`);
  const origin = hre.network.name;
  const outbox = hyperlaneCoreAddresses[origin].outbox;

  const factory = await hre.ethers.getContractFactory("HyperlaneMessageSender");

  const contract = await factory.deploy(outbox);
  await contract.deployTransaction.wait();

  console.log(
    `Deployed HyperlaneMessageSender to ${contract.address} on ${hre.network.name} with transaction ${contract.deployTransaction.hash}`
  );

  console.log(`You can verify the contracts with:`);
  console.log(
    `$ yarn hardhat verify --network ${hre.network.name} ${contract.address} ${outbox}`
  );
});

task("deploy-message-receiver", "deploys the HyperlaneMessageReceiver contract")
  .addParam(
    "origin",
    "the name of the origin chain",
    undefined,
    types.string,
    false
  )
  .setAction(async (taskArgs, hre) => {
    console.log(
      `Deploying HyperlaneMessageReceiver on ${hre.network.name} for messages from ${taskArgs.origin}`
    );
    const remote = hre.network.name;
    const inbox = hyperlaneCoreAddresses[remote].inboxes[taskArgs.origin];

    const factory = await hre.ethers.getContractFactory(
      "HyperlaneMessageReceiver"
    );

    const contract = await factory.deploy(inbox);
    await contract.deployTransaction.wait();

    console.log(
      `Deployed HyperlaneMessageReceiver to ${contract.address} on ${hre.network.name} listening to the outbox on ${taskArgs.origin} with transaction ${contract.deployTransaction.hash}`
    );
    console.log(`You can verify the contracts with:`);
    console.log(
      `$ yarn hardhat verify --network ${hre.network.name} ${contract.address} ${inbox}`
    );
  });

task(
  "send-message-via-HyperlaneMessageSender",
  "sends a message via a deployed HyperlaneMessageSender"
)
  .addParam(
    "sender",
    "Address of the HyperlaneMessageSender",
    undefined,
    types.string,
    false
  )
  .addParam(
    "receiver",
    "address of the HyperlaneMessageReceiver",
    undefined,
    types.string,
    false
  )
  .addParam(
    "remote",
    "Name of the remote chain on which HyperlaneMessageReceiver is on",
    undefined,
    types.string,
    false
  )
  .addParam("message", "the message you want to send", "HelloWorld")
  .setAction(async (taskArgs, hre) => {
    const signer = (await hre.ethers.getSigners())[0];
    const remote = taskArgs.remote;
    const remoteDomain = ChainNameToDomainId[remote];
    const senderFactory = await hre.ethers.getContractFactory(
      "HyperlaneMessageSender"
    );
    const sender = senderFactory.attach(taskArgs.sender);

    console.log(
      `Sending message "${taskArgs.message}" from ${hre.network.name} to ${taskArgs.remote}`
    );

    const tx = await sender.sendString(
      remoteDomain,
      utils.addressToBytes32(taskArgs.receiver),
      taskArgs.message
    );
    await tx.wait();

    console.log(
      `Send message at txHash ${tx.hash}. Check the debugger at https://explorer.hyperlane.xyz`
    );

    await tx.wait();

    const recipientUrl = await multiProvider
      .getChainConnection(remote)
      .getAddressUrl(taskArgs.receiver);
    console.log(
      `Check out the explorer page for receiver ${recipientUrl}#events`
    );
  });

export default config;
