// script/Deploy.s.sol
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/CarbonCreditToken.sol";
import "../src/CarbonRegistry.sol";
import "../src/CarbonMarketplace.sol";
import "../src/RetirementContract.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        CarbonCreditToken token = new CarbonCreditToken();
        CarbonRegistry registry = new CarbonRegistry(address(token));
        CarbonMarketplace marketplace = new CarbonMarketplace(address(token));
        RetirementContract retirement = new RetirementContract(address(token));
        
        // Setup roles
        token.grantRole(token.MINTER_ROLE(), address(registry));
        
        console.log("CarbonCreditToken deployed to:", address(token));
        console.log("CarbonRegistry deployed to:", address(registry));
        console.log("CarbonMarketplace deployed to:", address(marketplace));
        console.log("RetirementContract deployed to:", address(retirement));
        
        vm.stopBroadcast();
    }
}