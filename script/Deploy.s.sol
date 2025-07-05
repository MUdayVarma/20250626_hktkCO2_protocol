// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OracleChainlinkFunction.sol";
import "../src/CarbonCreditToken.sol";
import "../src/CarbonRegistry.sol";
import "../src/CarbonMarketplace.sol";
import "../src/RetirementContract.sol";
import "../src/PriceOracle.sol";

contract DeployScript is Script {
    // Deployment addresses
    address public chainlinkOracle;
    address public carbonToken;
    address public carbonRegistry;
    address public carbonMarketplace;
    address public retirementContract;
    address public priceOracle;
    
    // Network-specific configurations
    struct NetworkConfig {
        address functionsRouter;
        bytes32 donId;
        uint64 subscriptionId;
        address linkToken;
        address ethUsdPriceFeed;
        address btcUsdPriceFeed;
    }
    
    NetworkConfig public networkConfig;
    
    function setUp() public {
        // Configure network-specific parameters
        if (block.chainid == 1) {
            // Ethereum Mainnet
            networkConfig = NetworkConfig({
                functionsRouter: 0x65Dcc24F8ff9e51F10DCc7Ed1e4e2A61e6E14bd6, // Mainnet Functions Router
                donId: 0x66756e2d657468657265756d2d6d61696e6e65742d3100000000000000000000, // fun-ethereum-mainnet-1
                subscriptionId: 1, // Replace with your subscription ID
                linkToken: 0x514910771AF9Ca656af840dff83E8264EcF986CA,
                ethUsdPriceFeed: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419,
                btcUsdPriceFeed: 0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c
            });
        } else if (block.chainid == 11155111) {
            // Sepolia Testnet
            networkConfig = NetworkConfig({
                functionsRouter: 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0, // Sepolia Functions Router
                donId: 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000, // fun-ethereum-sepolia-1
                subscriptionId: 5258, // Replace with your subscription ID
                linkToken: 0x779877A7B0D9E8603169DdbD7836e478b4624789,
                ethUsdPriceFeed: 0x694AA1769357215DE4FAC081bf1f309aDC325306,
                btcUsdPriceFeed: 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
            });
        } else if (block.chainid == 80001) {
            // Mumbai Testnet
            networkConfig = NetworkConfig({
                functionsRouter: 0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C, // Mumbai Functions Router
                donId: 0x66756e2d706f6c79676f6e2d6d756d6261692d31000000000000000000000000, // fun-polygon-mumbai-1
                subscriptionId: 1, // Replace with your subscription ID
                linkToken: 0x326C977E6efc84E512bB9C30f76E30c160eD06FB,
                ethUsdPriceFeed: 0x0715A7794a1dc8e42615F059dD6e406A6594651A,
                btcUsdPriceFeed: 0x007A22900a3B98143368Bd5906f8E17e9867581b
            });
        } else {
            // Local/Anvil - Mock addresses
            networkConfig = NetworkConfig({
                functionsRouter: address(0x1),
                donId: bytes32("test_don_id"),
                subscriptionId: 1,
                linkToken: address(0x2),
                ethUsdPriceFeed: address(0x3),
                btcUsdPriceFeed: address(0x4)
            });
        }
    }
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying HBCO2 contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        console.log("Network Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy ChainlinkOracle (Chainlink Functions integration)
        console.log("\n=== Deploying ChainlinkOracle ===");
        ChainlinkOracle chainlinkOracleContract = new ChainlinkOracle(
            networkConfig.functionsRouter,
            networkConfig.donId,
            networkConfig.subscriptionId,
            address(0) // Registry will be set later
        );
        chainlinkOracle = address(chainlinkOracleContract);
        console.log("ChainlinkOracle deployed at:", chainlinkOracle);
        
        // Step 2: Deploy CarbonCreditToken with ChainlinkOracle
        console.log("\n=== Deploying CarbonCreditToken ===");
        CarbonCreditToken carbonTokenContract = new CarbonCreditToken(chainlinkOracle);
        carbonToken = address(carbonTokenContract);
        console.log("CarbonCreditToken deployed at:", carbonToken);
        
        // Step 3: Deploy CarbonRegistry
        console.log("\n=== Deploying CarbonRegistry ===");
        CarbonRegistry carbonRegistryContract = new CarbonRegistry(carbonToken, chainlinkOracle);
        carbonRegistry = address(carbonRegistryContract);
        console.log("CarbonRegistry deployed at:", carbonRegistry);
        
        // Step 4: Update ChainlinkOracle with CarbonRegistry address
        console.log("\n=== Updating ChainlinkOracle with Registry ===");
        chainlinkOracleContract.updateCarbonRegistry(carbonRegistry);
        console.log("Registry address updated in ChainlinkOracle");
        
        // Step 5: Deploy CarbonMarketplace
        console.log("\n=== Deploying CarbonMarketplace ===");
        CarbonMarketplace carbonMarketplaceContract = new CarbonMarketplace(carbonToken, chainlinkOracle);
        carbonMarketplace = address(carbonMarketplaceContract);
        console.log("CarbonMarketplace deployed at:", carbonMarketplace);
        
        // Step 6: Deploy RetirementContract
        console.log("\n=== Deploying RetirementContract ===");
        RetirementContract retirementContractInstance = new RetirementContract(
            carbonToken,
            chainlinkOracle,
            carbonRegistry
        );
        retirementContract = address(retirementContractInstance);
        console.log("RetirementContract deployed at:", retirementContract);
        
        // Step 7: Deploy CarbonPriceOracle
        console.log("\n=== Deploying CarbonPriceOracle ===");
        CarbonPriceOracle priceOracleContract = new CarbonPriceOracle(chainlinkOracle);
        priceOracle = address(priceOracleContract);
        console.log("CarbonPriceOracle deployed at:", priceOracle);
        
        // Step 8: Configure Price Oracle
        console.log("\n=== Configuring CarbonPriceOracle ===");
        priceOracleContract.updatePriceFeeds(
            networkConfig.ethUsdPriceFeed,
            networkConfig.btcUsdPriceFeed
        );
        console.log("Price feeds configured");
        
        // Step 9: Set up permissions and roles
        console.log("\n=== Setting up Permissions ===");
        
        // Grant MINTER_ROLE to registry
        bytes32 MINTER_ROLE = keccak256("MINTER_ROLE");
        carbonTokenContract.grantRole(MINTER_ROLE, carbonRegistry);
        console.log("Granted MINTER_ROLE to CarbonRegistry");
        
        // Grant ORACLE_ROLE to ChainlinkOracle and deployer
        bytes32 ORACLE_ROLE = keccak256("ORACLE_ROLE");
        carbonTokenContract.grantRole(ORACLE_ROLE, chainlinkOracle);
        carbonTokenContract.grantRole(ORACLE_ROLE, deployer);
        carbonRegistryContract.grantRole(ORACLE_ROLE, chainlinkOracle);
        carbonRegistryContract.grantRole(ORACLE_ROLE, deployer);
        console.log("Granted ORACLE_ROLE to ChainlinkOracle and deployer");
        
        // Grant OPERATOR_ROLE to deployer for ChainlinkOracle
        bytes32 OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
        chainlinkOracleContract.grantRole(OPERATOR_ROLE, deployer);
        console.log("Granted OPERATOR_ROLE to deployer");
        
        // Grant VERIFIER_ROLE to deployer
        bytes32 VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
        retirementContractInstance.grantRole(VERIFIER_ROLE, deployer);
        carbonRegistryContract.grantRole(VERIFIER_ROLE, deployer);
        console.log("Granted VERIFIER_ROLE to deployer");
        
        // Step 10: Verify initial setup
        console.log("\n=== Verifying Setup ===");
        verifyDeployment();
        
        vm.stopBroadcast();
        
        // Step 11: Save deployment addresses
        saveDeploymentAddresses();
        
        // Step 12: Display deployment summary
        displayDeploymentSummary();
    }
    
    function verifyDeployment() internal view {
        console.log("Verification checks:");
        
        // Check if contracts are deployed
        require(chainlinkOracle.code.length > 0, "ChainlinkOracle not deployed");
        require(carbonToken.code.length > 0, "CarbonCreditToken not deployed");
        require(carbonRegistry.code.length > 0, "CarbonRegistry not deployed");
        require(carbonMarketplace.code.length > 0, "CarbonMarketplace not deployed");
        require(retirementContract.code.length > 0, "RetirementContract not deployed");
        require(priceOracle.code.length > 0, "CarbonPriceOracle not deployed");
        
        console.log(unicode"✓ All contracts deployed successfully");
        
        // Check oracle configuration
        ChainlinkOracle oracleContract = ChainlinkOracle(chainlinkOracle);
        require(address(oracleContract.carbonRegistry()) == carbonRegistry, "Registry integration failed");
        
        console.log(unicode"✓ Oracle-Registry integration verified");
        
        // Check token integration
        CarbonCreditToken tokenContract = CarbonCreditToken(carbonToken);
        require(address(tokenContract.carbonOracle()) == chainlinkOracle, "Token oracle integration failed");
        
        console.log(unicode"✓ Token-Oracle integration verified");
        
        console.log(unicode"✓ All verification checks passed");
    }
    
    function saveDeploymentAddresses() internal {
        string memory deploymentData = string(abi.encodePacked(
            "{\n",
            '  "chainId": ', vm.toString(block.chainid), ",\n",
            '  "chainlinkOracle": "', vm.toString(chainlinkOracle), '",\n',
            '  "carbonToken": "', vm.toString(carbonToken), '",\n',
            '  "carbonRegistry": "', vm.toString(carbonRegistry), '",\n',
            '  "carbonMarketplace": "', vm.toString(carbonMarketplace), '",\n',
            '  "retirementContract": "', vm.toString(retirementContract), '",\n',
            '  "priceOracle": "', vm.toString(priceOracle), '",\n',
            '  "deploymentTimestamp": ', vm.toString(block.timestamp), ",\n",
            '  "deployer": "', vm.toString(msg.sender), '"\n',
            "}"
        ));
        
        string memory filename = string(abi.encodePacked("deployments/", vm.toString(block.chainid), ".json"));
        vm.writeFile(filename, deploymentData);
        
        console.log("Deployment addresses saved to:", filename);
    }
    
    function displayDeploymentSummary() internal view {
        console.log("\n====================================================");
        console.log(unicode"🎉 HBCO2 DEPLOYMENT COMPLETE 🎉");
        console.log("====================================================");
        console.log("");
        console.log(unicode"📋 Contract Addresses:");
        console.log("   ChainlinkOracle:    ", chainlinkOracle);
        console.log("   CarbonCreditToken:  ", carbonToken);
        console.log("   CarbonRegistry:     ", carbonRegistry);
        console.log("   CarbonMarketplace:  ", carbonMarketplace);
        console.log("   RetirementContract: ", retirementContract);
        console.log("   CarbonPriceOracle:  ", priceOracle);
        console.log("");
        console.log(unicode"🔗 Network Configuration:");
        console.log("   Chain ID:           ", block.chainid);
        console.log("   Functions Router:   ", networkConfig.functionsRouter);
        console.log("   DON ID:             ", vm.toString(networkConfig.donId));
        console.log("   Subscription ID:    ", networkConfig.subscriptionId);
        console.log("");
        console.log(unicode"⚡ Next Steps:");
        console.log("   1. Add ChainlinkOracle as consumer to your Functions subscription");
        console.log("   2. Fund subscription with LINK tokens");
        console.log("   3. Deploy and configure frontend");
        console.log("   4. Register carbon projects");
        console.log("   5. Start tokenizing carbon credits!");
        console.log("");
        console.log(unicode"💡 Important Notes:");
        console.log("   - ChainlinkOracle address:", chainlinkOracle);
        console.log("   - Add as consumer at: https://functions.chain.link");
        console.log("   - Minimum 5 LINK recommended for subscription");
        console.log("====================================================");
    }
}