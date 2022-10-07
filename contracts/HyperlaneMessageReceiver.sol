// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@hyperlane-xyz/core/interfaces/IInbox.sol";

contract HyperlaneMessageReceiver {
    IInbox inbox;
    bytes32 public lastSender;
    string public lastMessage;

    constructor(address _inbox) {
        inbox = IInbox(_inbox);
    }

    function handle(
        uint32,
        bytes32 _sender,
        bytes calldata _messageBody
    ) external {
      lastSender = _sender;
      lastMessage = string(_messageBody);
    }
}