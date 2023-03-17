import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "@hyperlane-xyz/utils";
import {
  TestRecipient__factory,
} from "@hyperlane-xyz/core";
import { MockInterchainAccountRouter, Ownee, Owner } from "../typechain-types";

describe("Hyperlane", function () {
  describe("Interchain Accounts", function () {
    const originDomain = 1;
    const destinationDomain = 2;

    let owner: Owner;
    let ownee: Ownee;
    let router: MockInterchainAccountRouter;

    beforeEach(async function () {
      const routerFactory = await ethers.getContractFactory(
        "MockInterchainAccountRouter"
      );
      const ownerFactory = await ethers.getContractFactory("Owner");
      const owneeFactory = await ethers.getContractFactory("Ownee");

      router = await routerFactory.deploy(originDomain);
      owner = await ownerFactory.deploy(router.address);
      
      const ownerICA = await router.getInterchainAccount(
        originDomain,
        owner.address
      );
      // Set ownee owner to the ICA of the owner
      ownee = await owneeFactory.deploy(ownerICA);
    });

    it("can set a fee", async function () {
      const fee = 42;

      await owner.setRemoteFee(destinationDomain, ownee.address, fee);
      await router.processNextPendingCall();
      expect((await ownee.fee()).toNumber()).to.eql(fee);
    });

    it ("can transfer ownership", async function () {
      // Random new owner
      const newOwner = router.address;

      await owner.transferRemoteOwnership(destinationDomain, ownee.address, newOwner);
      await router.processNextPendingCall();
      expect(await ownee.owner()).to.eql(newOwner);
    })
  });
});
