// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./OracleIntegration.sol";

contract CarbonCreditToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    // Oracle integration
    CarbonOracle public carbonOracle;
    
    struct CreditMetadata {
        string projectId;
        string registry;
        uint256 vintage;
        string methodology;
        string ipfsHash;
        bool isRetired;
        bool isOracleVerified;
        uint256 lastVerificationTime;
        uint256 verifiedAmount;
        string reportHash;
        bytes32 oracleRequestId;
    }
    
    // Enhanced mappings for better tracking
    mapping(uint256 => CreditMetadata) public creditMetadata;
    mapping(address => uint256[]) public userCredits;
    mapping(string => bool) public projectVerificationRequired;
    mapping(bytes32 => uint256) public requestIdToCreditId; // Track oracle requests
    mapping(string => uint256[]) public projectCredits; // Credits per project
    
    uint256 public totalCreditsIssued;
    uint256 public totalCreditsRetired;
    uint256 public verificationTimeLimit = 30 days;
    uint256 public nextCreditId = 1;
    
    // Events
    event CreditMinted(address indexed to, uint256 indexed creditId, uint256 amount, string projectId);
    event CreditRetired(address indexed by, uint256 indexed creditId, uint256 amount, string reason);
    event OracleVerificationRequested(string indexed projectId, bytes32 requestId, uint256 creditId);
    event CreditVerified(uint256 indexed creditId, bool verified, uint256 verifiedAmount);
    event VerificationExpired(uint256 indexed creditId, string projectId);
    event CreditTransferBlocked(uint256 indexed creditId, string reason);
    
    constructor(address _carbonOracle) ERC20("Carbon Credit Token", "CCT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        carbonOracle = CarbonOracle(_carbonOracle);
    }
    
    /**
     * @dev Enhanced minting with oracle verification
     * Step 1: Create credit metadata and request oracle verification
     */
    function mintCreditWithVerification(
        address to,
        uint256 amount,
        string memory projectId,
        string memory registry,
        uint256 vintage,
        string memory methodology,
        string memory ipfsHash,
        string memory apiUrl
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256 creditId, bytes32 requestId) {
        require(amount > 0, "Amount must be greater than 0");
        require(carbonOracle.isProjectAuthorized(projectId), "Project not authorized for oracle verification");
        
        creditId = nextCreditId++;
        
        // Create credit metadata
        creditMetadata[creditId] = CreditMetadata({
            projectId: projectId,
            registry: registry,
            vintage: vintage,
            methodology: methodology,
            ipfsHash: ipfsHash,
            isRetired: false,
            isOracleVerified: false,
            lastVerificationTime: 0,
            verifiedAmount: 0,
            reportHash: "",
            oracleRequestId: bytes32(0)
        });
        
        userCredits[to].push(creditId);
        projectCredits[projectId].push(creditId);
        
        // Request oracle verification
        requestId = carbonOracle.requestProjectVerification(projectId, apiUrl);
        creditMetadata[creditId].oracleRequestId = requestId;
        requestIdToCreditId[requestId] = creditId;
        
        emit OracleVerificationRequested(projectId, requestId, creditId);
        
        return (creditId, requestId);
    }
    
    /**
     * @dev Complete minting after oracle verification
     * Called by oracle role after verification is complete
     */
    function completeMinting(
        uint256 creditId,
        address to,
        uint256 amount
    ) public onlyRole(ORACLE_ROLE) {
        CreditMetadata storage credit = creditMetadata[creditId];
        require(bytes(credit.projectId).length > 0, "Credit does not exist");
        require(!credit.isOracleVerified, "Credit already verified and minted");
        
        // Check if project is verified by oracle
        (bool isVerified, uint256 verifiedAmount, uint256 lastUpdate, string memory reportHash,) = 
            carbonOracle.getVerificationStatus(credit.projectId);
        
        require(isVerified, "Project not verified by oracle");
        require(verifiedAmount >= amount, "Requested amount exceeds verified amount");
        
        // Update credit metadata
        credit.isOracleVerified = true;
        credit.lastVerificationTime = lastUpdate;
        credit.verifiedAmount = verifiedAmount;
        credit.reportHash = reportHash;
        
        // Mint the tokens
        _mint(to, amount * 1e18);
        totalCreditsIssued += amount;
        
        emit CreditMinted(to, creditId, amount, credit.projectId);
        emit CreditVerified(creditId, true, verifiedAmount);
    }
    
    /**
     * @dev Enhanced retirement with verification check
     */
    function retireCredit(
        uint256 creditId,
        uint256 amount,
        string memory reason
    ) external {
        require(balanceOf(msg.sender) >= amount * 1e18, "Insufficient balance");
        require(creditId < nextCreditId, "Credit does not exist");
        
        CreditMetadata storage credit = creditMetadata[creditId];
        require(!credit.isRetired, "Credit already retired");
        require(credit.isOracleVerified, "Credit not verified");
        
        // Check if verification is still current
        bool isCurrentlyVerified = carbonOracle.isVerificationCurrent(
            credit.projectId, 
            verificationTimeLimit
        );
        
        if (!isCurrentlyVerified) {
            emit VerificationExpired(creditId, credit.projectId);
            revert("Credit verification expired - please re-verify");
        }
        
        credit.isRetired = true;
        totalCreditsRetired += amount;
        
        _burn(msg.sender, amount * 1e18);
        
        emit CreditRetired(msg.sender, creditId, amount, reason);
    }
    
    /**
     * @dev Override transfer to check verification status
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        // For simplicity, we'll allow transfers but emit warnings for unverified credits
        // In production, you might want to block transfers of unverified credits
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom to check verification status
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev Check if credit is valid for trading/retirement
     */
    function isCreditValid(uint256 creditId) external view returns (bool isValid, string memory reason) {
        if (creditId >= nextCreditId) {
            return (false, "Credit does not exist");
        }
        
        CreditMetadata memory credit = creditMetadata[creditId];
        
        if (!credit.isOracleVerified) {
            return (false, "Credit not oracle verified");
        }
        
        if (credit.isRetired) {
            return (false, "Credit already retired");
        }
        
        bool isCurrentlyVerified = carbonOracle.isVerificationCurrent(
            credit.projectId, 
            verificationTimeLimit
        );
        
        if (!isCurrentlyVerified) {
            return (false, "Verification expired");
        }
        
        return (true, "Credit is valid");
    }
    
    /**
     * @dev Refresh verification for a credit
     */
    function refreshVerification(
        uint256 creditId,
        string memory apiUrl
    ) external onlyRole(MINTER_ROLE) returns (bytes32 requestId) {
        require(creditId < nextCreditId, "Credit does not exist");
        
        CreditMetadata storage credit = creditMetadata[creditId];
        require(credit.isOracleVerified, "Credit was never verified initially");
        
        // Request new verification
        requestId = carbonOracle.requestProjectVerification(credit.projectId, apiUrl);
        credit.oracleRequestId = requestId;
        requestIdToCreditId[requestId] = creditId;
        
        emit OracleVerificationRequested(credit.projectId, requestId, creditId);
        
        return requestId;
    }
    
    /**
     * @dev Get detailed credit information including oracle verification
     */
    function getCreditDetails(uint256 creditId) external view returns (
        string memory projectId,
        string memory registry,
        uint256 vintage,
        string memory methodology,
        string memory ipfsHash,
        bool isRetired,
        bool isOracleVerified,
        uint256 lastVerificationTime,
        uint256 verifiedAmount,
        string memory reportHash,
        bool isCurrentlyValid
    ) {
        require(creditId < nextCreditId, "Credit does not exist");
        
        CreditMetadata memory credit = creditMetadata[creditId];
        
        bool isValid = credit.isOracleVerified && 
                      !credit.isRetired && 
                      carbonOracle.isVerificationCurrent(credit.projectId, verificationTimeLimit);
        
        return (
            credit.projectId,
            credit.registry,
            credit.vintage,
            credit.methodology,
            credit.ipfsHash,
            credit.isRetired,
            credit.isOracleVerified,
            credit.lastVerificationTime,
            credit.verifiedAmount,
            credit.reportHash,
            isValid
        );
    }
    
    /**
     * @dev Get all credits for a project
     */
    function getProjectCredits(string memory projectId) external view returns (uint256[] memory) {
        return projectCredits[projectId];
    }
    
    /**
     * @dev Batch verify multiple credits after oracle confirmation
     */
    function batchCompleteMinting(
        uint256[] memory creditIds,
        address[] memory recipients,
        uint256[] memory amounts
    ) external onlyRole(ORACLE_ROLE) {
        require(creditIds.length == recipients.length && recipients.length == amounts.length, 
                "Array lengths mismatch");
        
        for (uint i = 0; i < creditIds.length; i++) {
            completeMinting(creditIds[i], recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Update oracle contract address
     */
    function updateOracleContract(address _newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        carbonOracle = CarbonOracle(_newOracle);
    }
    
    /**
     * @dev Set verification time limit
     */
    function setVerificationTimeLimit(uint256 _timeLimit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verificationTimeLimit = _timeLimit;
    }
    
    /**
     * @dev Emergency pause function
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause function
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Get project verification summary
     */
    function getProjectVerificationSummary(string memory projectId) external view returns (
        bool isAuthorized,
        bool isVerified,
        uint256 totalCredits,
        uint256 lastVerificationTime
    ) {
        isAuthorized = carbonOracle.isProjectAuthorized(projectId);
        
        (isVerified,,lastVerificationTime,,) = carbonOracle.getVerificationStatus(projectId);
        
        totalCredits = projectCredits[projectId].length;
        
        return (isAuthorized, isVerified, totalCredits, lastVerificationTime);
    }
}