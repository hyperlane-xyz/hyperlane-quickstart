// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "@hyperlane-xyz/core/contracts/mock/MockMailbox.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";

import "../../contracts/HyperlaneMessageSender.sol";
import "../../contracts/HyperlaneMessageReceiver.sol";

contract MessagingTest is Test {
    MockMailbox originMailbox;
    MockMailbox destinationMailbox;

    HyperlaneMessageSender sender;
    HyperlaneMessageReceiver receiver;

    uint32 originDomain = 1;
    uint32 destinationDomain = 2;

    function setUp() public {
        originMailbox = new MockMailbox(originDomain);
        destinationMailbox = new MockMailbox(destinationDomain);
        originMailbox.addRemoteMailbox(destinationDomain, destinationMailbox);
        sender = new HyperlaneMessageSender(address(originMailbox));
        receiver = new HyperlaneMessageReceiver(address(destinationMailbox));
    }

    function testSendMessage(string calldata _message) public {
        sender.sendString(destinationDomain, TypeCasts.addressToBytes32(address(receiver)), _message);
        destinationMailbox.processNextInboundMessage();
        assertEq(receiver.lastMessage(), _message);   
    }
}
