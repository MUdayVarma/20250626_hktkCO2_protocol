//SPDX-License-Identfier: MIT

pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {CarbonCreditToken} from "../src/CarbonCreditToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//import {DeployCarbonCreditToken} from "../script/CCTokenDeploy.s.sol";

contract TestCarbonCreditToken is Test {
    CarbonCreditToken public token;
    //DeployCarbonCreditToken public deployCCT;
    address owner;
    address user1;

    function setUp() public {
        owner = address(this); // test contract is the deployer
        user1 = vm.addr(1);
        //deployCCT = new DeployCarbonCreditToken();
        token = new CarbonCreditToken(); //deployCCT.run();
    }

    function testOnlyOwnerCanMintCredits() public {
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        token.mintCredits(user1, 1000, "PRJ001", "2024", "VerifierX");
    }

    function testMintCreditsStoresMetadata() public {
        token.mintCredits(user1, 1000, "PRJ001", "2024", "VerifierX");
        (
            string memory projectId,
            string memory vintage,
            string memory verifier
        ) = token.creditMetadata(0);

        assertEq(projectId, "PRJ001");
        assertEq(vintage, "2024");
        assertEq(verifier, "VerifierX");
    }

    function testMintIncrementsBatchId() public {
        token.mintCredits(user1, 1000, "PRJ001", "2024", "VerifierX");
        token.mintCredits(user1, 2000, "PRJ002", "2023", "VerifierY");

        (string memory p1, , ) = token.creditMetadata(0);
        (string memory p2, , ) = token.creditMetadata(1);

        assertEq(p1, "PRJ001");
        assertEq(p2, "PRJ002");
        assertEq(token.nextBatchId(), 2);
    }

    function testAnyUserCanRetireCredits() public {
        token.mintCredits(user1, 1000, "PRJ001", "2024", "VerifierX");

        // Now user1 owns 1000 credits, simulate user1 retiring 500
        vm.prank(user1);
        token.retireCredits(500);

        assertEq(token.balanceOf(user1), 500); // 1000 - 500 = 500
    }
}
