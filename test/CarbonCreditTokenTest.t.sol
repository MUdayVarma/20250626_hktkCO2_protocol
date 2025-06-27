//SPDX-License-Identifier: MIT
// test/CarbonCreditTokenTest.t.sol
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CarbonCreditToken.sol";
import "../src/CarbonRegistry.sol";
import "../src/CarbonMarketplace.sol";
import "../src/RetirementContract.sol";

contract CarbonCreditTest is Test {
    CarbonCreditToken token;
    CarbonRegistry registry;
    CarbonMarketplace marketplace;
    RetirementContract retirement;
    
    address admin = address(1);
    address user1 = address(2);
    address user2 = address(3);
    
    function setUp() public {
        vm.startPrank(admin);
        
        token = new CarbonCreditToken();
        registry = new CarbonRegistry(address(token));
        marketplace = new CarbonMarketplace(address(token));
        retirement = new RetirementContract(address(token));
        
        // Grant roles
        token.grantRole(token.MINTER_ROLE(), address(registry));
        
        vm.stopPrank();
    }
    
    function testMintCredits() public {
        vm.startPrank(admin);
        
        token.mintCredit(
            user1,
            100,
            "PROJECT-001",
            "Verra",
            2024,
            "VM0042",
            "QmHash123"
        );
        
        assertEq(token.balanceOf(user1), 100 * 1e18);
        vm.stopPrank();
    }
    
    function testMarketplaceListing() public {
        // Setup
        vm.startPrank(admin);
        token.mintCredit(user1, 100, "PROJECT-001", "Verra", 2024, "VM0042", "QmHash123");
        vm.stopPrank();
        
        // Create listing
        vm.startPrank(user1);
        token.approve(address(marketplace), 50 * 1e18);
        marketplace.createListing(50, 1 ether, "PROJECT-001", 2024);
        vm.stopPrank();
        
        // Buy listing
        vm.deal(user2, 10 ether);
        vm.startPrank(user2);
        marketplace.buyListing{value: 10 ether}(0, 10);
        vm.stopPrank();
        
        assertEq(token.balanceOf(user2), 10 * 1e18);
    }
    
    function testRetirement() public {
        // Setup
        vm.startPrank(admin);
        token.mintCredit(user1, 100, "PROJECT-001", "Verra", 2024, "VM0042", "QmHash123");
        vm.stopPrank();
        
        // Retire credits
        vm.startPrank(user1);
        uint256 retirementId = retirement.retireCredits(50, "Company offsetting", "Acme Corp");
        vm.stopPrank();
        
        assertEq(token.balanceOf(user1), 50 * 1e18);
        assertEq(retirement.totalRetired(), 50);
    }
}