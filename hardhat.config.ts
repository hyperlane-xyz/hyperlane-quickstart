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

task("send-message", "sends a message", async (taskArgs, hre) => {
  const signer = (await hre.ethers.getSigners())[0];
  const recipient = "0xBC3cFeca7Df5A45d61BC60E7898E63670e1654aE";
  const origin = "alfajores";
  const destination = "mumbai";
  const destinationDomain = ChainNameToDomainId[destination];
  const outboxC = hyperlaneCoreAddresses[origin].outbox;

  const outboxAbi = [
    "function dispatch(uint32 destinationDomain, bytes32 recipient, bytes calldata message) returns (uint256)",
  ];
  const outbox = new hre.ethers.Contract(outboxC, outboxAbi, signer);
  console.log(`Dispatching from ${await signer.getAddress()}`);
  const tx = await outbox.dispatch(
    destinationDomain,
    utils.addressToBytes32(recipient),
    hre.ethers.utils.arrayify(hre.ethers.utils.toUtf8Bytes("Send from Hardhat"))
  );

  const multiProvider = new MultiProvider(chainConnectionConfigs);

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

export default config;
