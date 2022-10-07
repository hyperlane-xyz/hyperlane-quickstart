
import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "@hyperlane-xyz/utils";
import { MockInbox__factory, MockOutbox__factory, TestRecipient__factory } from "@hyperlane-xyz/core";


describe("Hyperlane", function () {
  describe("Hyperlane Message Sending and Receiving", function () {
    it("should be able to send a message", async function () {
      const originDomain = 1
      const signer = (await ethers.getSigners())[0]
      const inbox = await (new MockInbox__factory(signer).deploy())
      await inbox.deployed()
      const outbox = await (new MockOutbox__factory(signer).deploy(originDomain, inbox.address))
      await outbox.deployed()
      const recipient = await (new TestRecipient__factory(signer).deploy())
      const data = ethers.utils.toUtf8Bytes("This is a test message")
      
      await outbox.dispatch(1, utils.addressToBytes32(recipient.address), data)
      await inbox.processNextPendingMessage()
  
      const dataReceived = await recipient.lastData()
      expect(dataReceived).to.eql(ethers.utils.hexlify(data))
    })
  })
});
