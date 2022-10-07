// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "@hyperlane-xyz/core/contracts/mock/MockOutbox.sol";
import "@hyperlane-xyz/core/contracts/mock/MockInbox.sol";
import "@hyperlane-xyz/core/interfaces/IInbox.sol";
import "@hyperlane-xyz/core/interfaces/IOutbox.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";

import "../../contracts/HyperlaneMessageSender.sol";
import "../../contracts/HyperlaneMessageReceiver.sol";

contract MessagingTest is Test {
    MockOutbox outbox;
    MockInbox inbox;

    HyperlaneMessageSender sender;
    HyperlaneMessageReceiver receiver;

    uint32 originDomain = 1;
    uint32 remoteDomain = 2;

    function setUp() public {
        inbox = new MockInbox();
        outbox = new MockOutbox(originDomain, address(inbox));
        sender = new HyperlaneMessageSender(address(outbox));
        receiver = new HyperlaneMessageReceiver(address(inbox));
    }

    function testSendMessage(string calldata _message) public {
        sender.sendString(remoteDomain, TypeCasts.addressToBytes32(address(receiver)), _message);
        inbox.processNextPendingMessage();
        assertEq(receiver.lastMessage(), _message);   
    }
}
