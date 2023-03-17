// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {IInterchainQueryRouter} from "./IInterchainQueryRouter.sol";
import {Call} from "./OwnableMulticall.sol";

interface Ownable {
    function owner() external view returns (address);
}

contract OwnerReader {
    IInterchainQueryRouter router;

    address public lastTarget;
    uint32 public lastDomain;
    address public lastOwner;

    constructor(address _router) {
        router = IInterchainQueryRouter(_router);
    }

    function readRemoteOwner(uint32 _destinationDomain, address target)
        external
    {
        router.query(
            _destinationDomain,
            Call({to: target, data: abi.encodePacked(Ownable.owner.selector)}),
            abi.encodeWithSelector(this.receiveQueryResult.selector, target, _destinationDomain)
        );
    }

    function receiveQueryResult(address _target, uint32 _domain, address _owner) public {
        lastOwner = _owner;
        lastDomain = _domain;
        lastTarget = _target;
    }
}
