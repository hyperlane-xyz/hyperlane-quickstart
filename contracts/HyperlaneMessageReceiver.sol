// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@hyperlane-xyz/core/interfaces/IInbox.sol";

contract HyperlaneMessageReceiver {
    IInbox inbox;
    bytes32 public lastSender;
    string public lastMessage;

    event ReceivedMessage(uint32 origin, bytes32 sender, bytes message);

    constructor(address _inbox) {
        inbox = IInbox(_inbox);
    }

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) external {
      lastSender = _sender;
      lastMessage = string(_message);
      emit ReceivedMessage(_origin, _sender, _message);
    }
}