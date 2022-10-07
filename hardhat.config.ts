import { HardhatUserConfig, task } from "hardhat/config";
import {
  chainConnectionConfigs,
  ChainNameToDomainId,
  MultiProvider,
  objMap,
} from "@hyperlane-xyz/sdk";
import { utils } from "@hyperlane-xyz/utils";
import "@nomicfoundation/hardhat-toolbox";
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
  .addParam("destination", "The destination of this message")
  .setAction(async (taskArgs, hre) => {
    const signer = (await hre.ethers.getSigners())[0];
    const recipient = "0xBC3cFeca7Df5A45d61BC60E7898E63670e1654aE";
    const origin = hre.network.name;
    const destination = taskArgs.destination;
    const destinationDomain = ChainNameToDomainId[destination];
    const outboxC = hyperlaneCoreAddresses[origin].outbox;

    const outbox = new hre.ethers.Contract(outboxC, OUTBOX_ABI, signer);
    console.log(`Dispatching from ${await signer.getAddress()}`);
    const tx = await outbox.dispatch(
      destinationDomain,
      utils.addressToBytes32(recipient),
      hre.ethers.utils.arrayify(
        hre.ethers.utils.toUtf8Bytes("Send from Hardhat")
      )
    );

    await tx.wait();
    console.log(
      `Send message at txHash ${tx.hash}. Check the debugger at https://explorer.hyperlane.xyz`
    );

    const recipientUrl = await multiProvider
      .getChainConnection(destination)
      .getAddressUrl(recipient);
    console.log(
      `Check out the explorer page for recipient ${recipientUrl}#events`
    );
  });

task("make-ica-call", "Makes an Interchain Account call")
  .addParam("destination", "The destination of this message")
  .setAction(async (taskArgs, hre) => {
    const signer = (await hre.ethers.getSigners())[0];
    const recipient = "0xBC3cFeca7Df5A45d61BC60E7898E63670e1654aE";
    const interchainAccountAddress =
      "0x28DB114018576cF6c9A523C17903455A161d18C4";
    const origin = hre.network.name;
    const destination = taskArgs.destination;
    const destinationDomain = ChainNameToDomainId[destination];
    // Arbitrary values
    const amount = 42;
    const message = "Sent from an ICA";

    const interchainAccountRouter = new hre.ethers.Contract(
      interchainAccountAddress,
      INTERCHAIN_ACCOUNT_ROUTER_ABI,
      signer
    );

    const recipientInterface = new hre.ethers.utils.Interface(TESTRECIPIENT_ABI);
    const calldata = recipientInterface.encodeFunctionData("fooBar", [
      amount,
      message,
    ]);
    const tx = await interchainAccountRouter.dispatch(destinationDomain, [
      [recipient, calldata],
    ]);
    console.log(
      `Send message at txHash ${tx.hash}. Check the debugger at https://explorer.hyperlane.xyz`
    );

    await tx.wait();

    const recipientUrl = await multiProvider
      .getChainConnection(destination)
      .getAddressUrl(recipient);
    console.log(
      `Check out the explorer page for recipient ${recipientUrl}#events`
    );
  });

export default config;
