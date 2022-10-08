// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {Call} from "./OwnableMulticall.sol";

interface IInterchainAccountRouter {
    function dispatch(uint32 _destinationDomain, Call[] calldata calls)
        external;

    function getInterchainAccount(uint32 _origin, address _sender) external view;
}
