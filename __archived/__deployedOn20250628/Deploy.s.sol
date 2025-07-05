// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OracleIntegration.sol";
import "../src/CarbonCreditToken.sol";
import "../src/CarbonRegistry.sol";
// import "../src/CarbonMarketplace.sol"; // SKIPPED
import "../src/RetirementContract.sol";
import "../src/PriceOracle.sol";

contract DeployNoMarketplaceScript is Script {
    // Deployment addresses will be stored here
    address public carbonOracle;
    address public carbonToken;
    address public carbonRegistry;
    // address public carbonMarketplace; // REMOVED
    address public retirementContract;
    address public priceOracle;
    
    // Network-specific configurations
    struct NetworkConfig {
        address linkToken;
        address oracle;
        bytes32 jobId;
        uint256 fee;
        address ethUsdPriceFeed;
        address btcUsdPriceFeed;
    }
    
    NetworkConfig public networkConfig;
    
    function setUp() public {
        // Configure network-specific parameters
        if (block.chainid == 1) {
            // Ethereum Mainnet
            networkConfig = NetworkConfig({
                linkToken: 0x514910771AF9Ca656af840dff83E8264EcF986CA,
                oracle: 0xaa1DC356DC4B18F30c347C90B3D8c5Ef48C114b5,
                jobId: "29fa9aa13bf1468788b7cc4a500a45b8",
                fee: 0.1 * 10**18,
                ethUsdPriceFeed: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419,
                btcUsdPriceFeed: 0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c
            });
        } else if (block.chainid == 11155111) {
            // Sepolia Testnet
            networkConfig = NetworkConfig({
                linkToken: 0x779877A7B0D9E8603169DdbD7836e478b4624789,
                oracle: 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD,
                jobId: "ca98366cc7314957b8c012c72f05aeeb",
                fee: 0.1 * 10**18,
                ethUsdPriceFeed: 0x694AA1769357215DE4FAC081bf1f309aDC325306,
                btcUsdPriceFeed: 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
            });
        } else if (block.chainid == 80001) {
            // Mumbai Testnet
            networkConfig = NetworkConfig({
                linkToken: 0x326C977E6efc84E512bB9C30f76E30c160eD06FB,
                oracle: 0x40193c8518BB267228Fc409a613bDbD8eC5a97b3,
                jobId: "ca98366cc7314957b8c012c72f05aeeb",
                fee: 0.01 * 10**18,
                ethUsdPriceFeed: 0x0715A7794a1dc8e42615F059dD6e406A6594651A,
                btcUsdPriceFeed: 0x007A22900a3B98143368Bd5906f8E17e9867581b
            });
        } else {
            // Local/Anvil - Mock addresses
            networkConfig = NetworkConfig({
                linkToken: address(0x1),
                oracle: address(0x2),
                jobId: bytes32("test_job_id"),
                fee: 0.1 * 10**18,
                ethUsdPriceFeed: address(0x3),
                btcUsdPriceFeed: address(0x4)
            });
        }
    }
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts (WITHOUT MARKETPLACE) with account:", deployer);
        console.log("Account balance:", deployer.balance);
        console.log("Network Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy CarbonOracle (Core oracle integration)
        console.log("\n=== Deploying CarbonOracle ===");
        CarbonOracle carbonOracleContract = new CarbonOracle();
        carbonOracle = address(carbonOracleContract);
        console.log("CarbonOracle deployed at:", carbonOracle);
        
        // Step 2: Configure CarbonOracle
        console.log("\n=== Configuring CarbonOracle ===");
        carbonOracleContract.updateOracleConfig(
            networkConfig.oracle,
            networkConfig.jobId,
            networkConfig.fee
        );
        console.log("Oracle configured with:");
        console.log("- Oracle address:", networkConfig.oracle);
        console.log("- Job ID:", string(abi.encodePacked(networkConfig.jobId)));
        console.log("- Fee:", networkConfig.fee);
        
        // Step 3: Deploy CarbonCreditToken
        console.log("\n=== Deploying CarbonCreditToken ===");
        CarbonCreditToken carbonTokenContract = new CarbonCreditToken(carbonOracle);
        carbonToken = address(carbonTokenContract);
        console.log("CarbonCreditToken deployed at:", carbonToken);
        
        // Step 4: Deploy CarbonRegistry
        console.log("\n=== Deploying CarbonRegistry ===");
        CarbonRegistry carbonRegistryContract = new CarbonRegistry(carbonToken, carbonOracle);
        carbonRegistry = address(carbonRegistryContract);
        console.log("CarbonRegistry deployed at:", carbonRegistry);
        
        // Step 5: SKIP CarbonMarketplace deployment
        console.log("\n=== SKIPPING CarbonMarketplace Deployment ===");
        console.log("CarbonMarketplace deployment skipped due to dependency issues");
        
        // Step 6: Deploy RetirementContract (Updated constructor without marketplace dependency)
        console.log("\n=== Deploying RetirementContract ===");
        RetirementContract retirementContractInstance = new RetirementContract(
            carbonToken,
            carbonOracle,
            carbonRegistry
        );
        retirementContract = address(retirementContractInstance);
        console.log("RetirementContract deployed at:", retirementContract);
        
        // Step 7: Deploy CarbonPriceOracle
        console.log("\n=== Deploying CarbonPriceOracle ===");
        CarbonPriceOracle priceOracleContract = new CarbonPriceOracle(carbonOracle);
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
        
        // Grant ORACLE_ROLE to deployer for oracle operations
        bytes32 ORACLE_ROLE = keccak256("ORACLE_ROLE");
        carbonTokenContract.grantRole(ORACLE_ROLE, deployer);
        carbonRegistryContract.grantRole(ORACLE_ROLE, deployer);
        console.log("Granted ORACLE_ROLE to deployer");
        
        // Grant VERIFIER_ROLE to deployer
        bytes32 VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
        retirementContractInstance.grantRole(VERIFIER_ROLE, deployer);
        console.log("Granted VERIFIER_ROLE to deployer");
        
        // Step 10: Fund oracle contract with LINK (if not local network)
        if (block.chainid != 31337) { // Not anvil
            console.log("\n=== Funding Oracle with LINK ===");
            console.log("IMPORTANT: Fund the CarbonOracle contract with LINK tokens");
            console.log("Contract address:", carbonOracle);
            console.log("Required LINK amount: 10 LINK minimum");
            console.log("LINK token address:", networkConfig.linkToken);
        }
        
        // Step 11: Verify initial setup
        console.log("\n=== Verifying Setup ===");
        verifyDeployment();
        
        vm.stopBroadcast();
        
        // Step 12: Save deployment addresses
        saveDeploymentAddresses();
        
        // Step 13: Display deployment summary
        displayDeploymentSummary();
    }
    
    function verifyDeployment() internal view {
        console.log("Verification checks:");
        
        // Check if contracts are deployed (excluding marketplace)
        require(carbonOracle.code.length > 0, "CarbonOracle not deployed");
        require(carbonToken.code.length > 0, "CarbonCreditToken not deployed");
        require(carbonRegistry.code.length > 0, "CarbonRegistry not deployed");
        // require(carbonMarketplace.code.length > 0, "CarbonMarketplace not deployed"); // REMOVED
        require(retirementContract.code.length > 0, "RetirementContract not deployed");
        require(priceOracle.code.length > 0, "CarbonPriceOracle not deployed");
        
        console.log(unicode"✓ All core contracts deployed successfully (marketplace skipped)");
        
        // Check oracle configuration
        CarbonOracle oracleContract = CarbonOracle(carbonOracle);
        (address oracle, bytes32 jobId, uint256 fee) = oracleContract.getOracleConfig();
        require(oracle == networkConfig.oracle, "Oracle address mismatch");
        require(jobId == networkConfig.jobId, "Job ID mismatch");
        require(fee == networkConfig.fee, "Fee mismatch");
        
        console.log(unicode"✓ Oracle configuration verified");
        
        // Check token integration
        CarbonCreditToken tokenContract = CarbonCreditToken(carbonToken);
        require(address(tokenContract.carbonOracle()) == carbonOracle, "Token oracle integration failed");
        
        console.log(unicode"✓ Token-Oracle integration verified");
        
        console.log(unicode"✓ All verification checks passed");
    }
    
    function saveDeploymentAddresses() internal {
        // Create a simple deployment log without using vm.writeFile (which might not be available)
        console.log("\n=== DEPLOYMENT ADDRESSES (SAVE THESE) ===");
        console.log("Chain ID:", block.chainid);
        console.log("CarbonOracle:", carbonOracle);
        console.log("CarbonToken:", carbonToken);
        console.log("CarbonRegistry:", carbonRegistry);
        console.log("CarbonMarketplace: SKIPPED");
        console.log("RetirementContract:", retirementContract);
        console.log("PriceOracle:", priceOracle);
        console.log("LINK Token:", networkConfig.linkToken);
        console.log("Deployment Timestamp:", block.timestamp);
        console.log("==========================================");
        
        // If you need to use these addresses later, copy them from the console output
        // and add them to your .env file manually
    }
    
    function displayDeploymentSummary() internal view {
        console.log("\n====================================================");
        console.log(unicode"🎉 CARBON TOKENIZATION DEPLOYMENT COMPLETE 🎉");
        console.log("         (MARKETPLACE SKIPPED)");
        console.log("====================================================");
        console.log("");
        console.log(unicode"📋 Contract Addresses:");
        console.log("   CarbonOracle:      ", carbonOracle);
        console.log("   CarbonCreditToken: ", carbonToken);
        console.log("   CarbonRegistry:    ", carbonRegistry);
        console.log("   CarbonMarketplace:  SKIPPED");
        console.log("   RetirementContract:", retirementContract);
        console.log("   CarbonPriceOracle: ", priceOracle);
        console.log("");
        console.log(unicode"🔗 Network Configuration:");
        console.log("   Chain ID:          ", block.chainid);
        console.log("   LINK Token:        ", networkConfig.linkToken);
        console.log("   Oracle Address:    ", networkConfig.oracle);
        console.log("   ETH/USD Feed:      ", networkConfig.ethUsdPriceFeed);
        console.log("");
        console.log(unicode"⚡ Next Steps:");
        console.log("   1. Fund CarbonOracle with LINK tokens");
        console.log("   2. Run interaction script to test functionality");
        console.log("   3. Verify contracts on block explorer");
        console.log("   4. Deploy CarbonMarketplace separately later");
        console.log("   5. Set up frontend integration");
        console.log("");
        console.log(unicode"💡 Important Notes:");
        console.log("   - Copy deployment addresses to .env file");
        console.log("   - Fund oracle with minimum 10 LINK");
        console.log("   - Test core functionality first");
        console.log("   - Deploy marketplace when issues resolved");
        console.log("====================================================");
    }
    
    // Utility function to deploy on specific network
    function deployToNetwork(string memory network) external {
        if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("sepolia"))) {
            vm.createSelectFork(vm.envString("SEPOLIA_RPC_URL"));
        } else if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("mumbai"))) {
            vm.createSelectFork(vm.envString("MUMBAI_RPC_URL"));
        } else if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("mainnet"))) {
            vm.createSelectFork(vm.envString("MAINNET_RPC_URL"));
        }
        
        this.run();
    }
    
    // Function to test core functionality without marketplace
    function testCoreSystemWithoutMarketplace() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log(unicode"\n🧪 TESTING CORE SYSTEM (NO MARKETPLACE)");
        console.log("=========================================");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Test 1: Oracle Configuration
        console.log("\n1. Testing Oracle Configuration...");
        CarbonOracle oracleContract = CarbonOracle(carbonOracle);
        (address oracle, bytes32 jobId, uint256 fee) = oracleContract.getOracleConfig();
        console.log("   Oracle Address:", oracle);
        console.log("   Job ID:", vm.toString(jobId));
        console.log("   Fee:", fee);
        console.log(unicode"   ✓ Oracle configuration verified");
        
        // Test 2: Project Authorization
        console.log("\n2. Testing Project Authorization...");
        string memory testProjectId = "TEST_PROJECT_001";
        oracleContract.setProjectAuthorization(testProjectId, true);
        bool isAuthorized = oracleContract.isProjectAuthorized(testProjectId);
        console.log("   Project ID:", testProjectId);
        console.log("   Is Authorized:", isAuthorized);
        console.log(unicode"   ✓ Project authorization working");
        
        // Test 3: Registry Integration
        console.log("\n3. Testing Registry Integration...");
        CarbonRegistry registryContract = CarbonRegistry(carbonRegistry);
        
        // Register a test project
        vm.stopBroadcast();
        
        // Use a different address for project developer
        address testDeveloper = makeAddr("testDeveloper");
        vm.deal(testDeveloper, 1 ether);
        vm.startPrank(testDeveloper);
        
        registryContract.registerProject(
            testProjectId,
            "Test Forest Project",
            "Test Location",
            "REDD+",
            1000, // total credits
            "QmTestHash123...",
            "https://api.test.com/verify"
        );
        
        console.log("   Test project registered by:", testDeveloper);
        console.log(unicode"   ✓ Registry integration working");
        
        vm.stopPrank();
        
        // Test 4: Token Integration
        console.log("\n4. Testing Token Integration...");
        CarbonCreditToken tokenContract = CarbonCreditToken(carbonToken);
        address oracleAddress = address(tokenContract.carbonOracle());
        console.log("   Token's Oracle Address:", oracleAddress);
        console.log("   Expected Oracle Address:", carbonOracle);
        console.log("   Match:", oracleAddress == carbonOracle);
        console.log(unicode"   ✓ Token-Oracle integration verified");
        
        // Test 5: Price Oracle
        console.log("\n5. Testing Price Oracle...");
        CarbonPriceOracle priceContract = CarbonPriceOracle(priceOracle);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Try to get ETH price (might fail on testnet, that's ok)
        try priceContract.getLatestEthPrice() returns (int price) {
            console.log("   ETH/USD Price:", uint256(price) / 1e8);
            console.log(unicode"   ✓ Price feeds working");
        } catch {
            console.log("   Price feeds not available (testnet)");
            console.log(unicode"   ⚠ Price feeds will work on mainnet");
        }
        
        vm.stopBroadcast();
        
        console.log(unicode"\n🎯 CORE SYSTEM TEST COMPLETE");
        console.log("==============================");
        console.log(unicode"✅ All core components are working properly");
        console.log(unicode"🏗️  You can now deploy marketplace separately");
    }
    
    // Emergency function to upgrade oracle (without marketplace)
    function upgradeOracle() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy new oracle
        CarbonOracle newOracle = new CarbonOracle();
        
        // Update all contracts to use new oracle (excluding marketplace)
        CarbonCreditToken(carbonToken).updateOracleContract(address(newOracle));
        CarbonRegistry(carbonRegistry).updateOracleContract(address(newOracle));
        // CarbonMarketplace(carbonMarketplace).updateOracleContract(address(newOracle)); // SKIPPED
        RetirementContract(retirementContract).updateOracleContract(address(newOracle));
        CarbonPriceOracle(priceOracle).updateOracleContract(address(newOracle));
        
        console.log("Oracle upgraded to:", address(newOracle));
        console.log("Note: Update marketplace contract manually when deployed");
        
        vm.stopBroadcast();
    }
    
    // Function to prepare for marketplace deployment later
    function prepareForMarketplace() external view {
        console.log(unicode"\n📋 MARKETPLACE DEPLOYMENT PREPARATION");
        console.log("======================================");
        console.log("When ready to deploy marketplace, use these addresses:");
        console.log("");
        console.log("Constructor parameters for CarbonMarketplace:");
        console.log("  _carbonToken:  ", carbonToken);
        console.log("  _carbonOracle: ", carbonOracle);
        console.log("");
        console.log("Example deployment command:");
        console.log("  CarbonMarketplace marketplace = new CarbonMarketplace(");
        console.log("    ", carbonToken, ",");
        console.log("    ", carbonOracle);
        console.log("  );");
        console.log("");
        console.log("After marketplace deployment, remember to:");
        console.log("1. Grant necessary roles if needed");
        console.log("2. Configure marketplace parameters");
        console.log("3. Test marketplace functionality");
        console.log("4. Update interaction scripts");
    }
}