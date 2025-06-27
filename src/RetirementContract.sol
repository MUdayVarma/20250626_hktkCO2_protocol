// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ICarbonCreditToken.sol";

contract RetirementContract is AccessControl {
    struct RetirementRecord {
        uint256 retirementId;
        address retiree;
        uint256 amount;
        string reason;
        string beneficiary;
        uint256 timestamp;
        string proofHash;
        bool isVerified;
    }
    
    ICarbonCreditToken public carbonToken;
    
    mapping(uint256 => RetirementRecord) public retirements;
    mapping(address => uint256[]) public userRetirements;
    mapping(string => uint256) public companyRetirements; // company name => total retired
    
    uint256 public nextRetirementId;
    uint256 public totalRetired;
    
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    event CarbonRetired(
        uint256 indexed retirementId,
        address indexed retiree,
        uint256 amount,
        string reason
    );
    
    event RetirementVerified(uint256 indexed retirementId, address indexed verifier);
    
    constructor(address _carbonToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        carbonToken = ICarbonCreditToken(_carbonToken);
    }
    
    function retireCredits(
        uint256 amount,
        string memory reason,
        string memory beneficiary
    ) external returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(carbonToken.balanceOf(msg.sender) >= amount * 1e18, "Insufficient balance");
        
        uint256 retirementId = nextRetirementId++;
        
        retirements[retirementId] = RetirementRecord({
            retirementId: retirementId,
            retiree: msg.sender,
            amount: amount,
            reason: reason,
            beneficiary: beneficiary,
            timestamp: block.timestamp,
            proofHash: "",
            isVerified: false
        });
        
        userRetirements[msg.sender].push(retirementId);
        companyRetirements[beneficiary] += amount;
        totalRetired += amount;
        
        // Burn the tokens
        carbonToken.retireCredit(retirementId, amount, reason);
        
        emit CarbonRetired(retirementId, msg.sender, amount, reason);
        
        return retirementId;
    }
    
    function verifyRetirement(
        uint256 retirementId,
        string memory proofHash
    ) external onlyRole(VERIFIER_ROLE) {
        RetirementRecord storage retirement = retirements[retirementId];
        require(retirement.retiree != address(0), "Retirement does not exist");
        require(!retirement.isVerified, "Already verified");
        
        retirement.proofHash = proofHash;
        retirement.isVerified = true;
        
        emit RetirementVerified(retirementId, msg.sender);
    }
    
    function getRetirementProof(uint256 retirementId) external view returns (
        address retiree,
        uint256 amount,
        string memory reason,
        string memory beneficiary,
        uint256 timestamp,
        string memory proofHash,
        bool isVerified
    ) {
        RetirementRecord memory retirement = retirements[retirementId];
        return (
            retirement.retiree,
            retirement.amount,
            retirement.reason,
            retirement.beneficiary,
            retirement.timestamp,
            retirement.proofHash,
            retirement.isVerified
        );
    }
    
    function getUserRetirements(address user) external view returns (uint256[] memory) {
        return userRetirements[user];
    }
    
    function getCompanyTotalRetired(string memory company) external view returns (uint256) {
        return companyRetirements[company];
    }
}