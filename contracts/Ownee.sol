// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import "./IInterchainAccountRouter.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

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