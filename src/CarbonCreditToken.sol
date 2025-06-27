// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract CarbonCreditToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    struct CreditMetadata {
        string projectId;
        string registry; // Verra, Gold Standard, etc.
        uint256 vintage;
        string methodology;
        string ipfsHash;
        bool isRetired;
    }
    
    mapping(uint256 => CreditMetadata) public creditMetadata;
    mapping(address => uint256[]) public userCredits;
    
    uint256 public totalCreditsIssued;
    uint256 public totalCreditsRetired;
    
    event CreditMinted(
        address indexed to,
        uint256 indexed creditId,
        uint256 amount,
        string projectId
    );
    
    event CreditRetired(
        address indexed by,
        uint256 indexed creditId,
        uint256 amount,
        string reason
    );
    
    constructor() ERC20("Carbon Credit Token", "CCT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }
    
    function mintCredit(
        address to,
        uint256 amount,
        string memory projectId,
        string memory registry,
        uint256 vintage,
        string memory methodology,
        string memory ipfsHash
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 creditId = totalCreditsIssued++;
        
        creditMetadata[creditId] = CreditMetadata({
            projectId: projectId,
            registry: registry,
            vintage: vintage,
            methodology: methodology,
            ipfsHash: ipfsHash,
            isRetired: false
        });
        
        userCredits[to].push(creditId);
        _mint(to, amount * 1e18); // 1 token = 1 ton CO2
        
        emit CreditMinted(to, creditId, amount, projectId);
    }
    
    function retireCredit(
        uint256 creditId,
        uint256 amount,
        string memory reason
    ) external {
        require(balanceOf(msg.sender) >= amount * 1e18, "Insufficient balance");
        require(!creditMetadata[creditId].isRetired, "Credit already retired");
        
        creditMetadata[creditId].isRetired = true;
        totalCreditsRetired += amount;
        
        _burn(msg.sender, amount * 1e18);
        
        emit CreditRetired(msg.sender, creditId, amount, reason);
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}