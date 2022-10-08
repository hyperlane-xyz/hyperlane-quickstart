// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";

import "../../contracts/Owner.sol";
import "../../contracts/Ownee.sol";
import "../../contracts/MockInterchainAccountRouter.sol";

contract InterchainAccountTest is Test {
    Owner owner;
    Ownee ownee;
    MockInterchainAccountRouter router;
    uint32 originDomain = 1;
    uint32 remoteDomain = 2;

    function setUp() public {
        router = new MockInterchainAccountRouter(originDomain);
        owner = new Owner(address(router));
        

        address ownerICA = router.getInterchainAccount(
            originDomain,
            address(owner)
        );
        // Sets the ownee owner to the ICA of the owner;
        ownee = new Ownee(ownerICA);
    }

    function testSettingNewOwner(address newOwner) public {
        require(newOwner != address(0x0));
        owner.transferRemoteOwnership(remoteDomain, address(router), newOwner);
        router.processNextPendingCall();
        assertEq(ownee.owner(), address(router));
    }

    function testSettingFee(uint256 newFee) public {
        require(newFee != 0x0);
        owner.setRemoteFee(remoteDomain, address(ownee), newFee);
        router.processNextPendingCall();
        assertEq(ownee.fee(), newFee);
    }
}
