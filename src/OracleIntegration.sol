// SPDX-License-Identifier: MIT
// src/OracleIntegration.sol
/*
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract CarbonOracle is ChainlinkClient {
    using Chainlink for Chainlink.Request;
    
    struct ProjectVerification {
        string projectId;
        bool isVerified;
        uint256 verifiedAmount;
        uint256 lastUpdate;
        string reportHash;
    }
    
    mapping(string => ProjectVerification) public verifications;
    mapping(bytes32 => string) public requestToProject;
    
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    
    event ProjectVerificationRequested(string indexed projectId, bytes32 requestId);
    event ProjectVerificationReceived(string indexed projectId, bool verified, uint256 amount);
    
    constructor() {
        setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB); // Sepolia LINK
        oracle = 0xCC79157eb46F5624204f47AB42b3906cAA40eaB7; // Sepolia Oracle
        jobId = "ca98366cc7314957b8c012c72f05aeeb"; // GET request job
        fee = 0.1 * 10 ** 18; // 0.1 LINK
    }
    
    function requestProjectVerification(
        string memory projectId,
        string memory apiUrl
    ) public returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        request.add("get", apiUrl);
        request.add("path", "verified");
        
        requestId = sendChainlinkRequest(request, fee);
        requestTo
*/