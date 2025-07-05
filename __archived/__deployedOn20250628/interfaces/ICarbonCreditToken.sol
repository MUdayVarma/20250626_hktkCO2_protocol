// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICarbonCreditToken {
    // Enhanced interface for oracle-integrated carbon credit token
    
    /**
     * @dev Mint credits with oracle verification
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
    ) external returns (uint256 creditId, bytes32 requestId);
    
    /**
     * @dev Complete minting after oracle verification
     */
    function completeMinting(
        uint256 creditId,
        address to,
        uint256 amount
    ) external;
    
    /**
     * @dev Legacy mint function for backward compatibility
     */
    function mintCredit(
        address to,
        uint256 amount,
        string memory projectId,
        string memory registry,
        uint256 vintage,
        string memory methodology,
        string memory ipfsHash
    ) external;
    
    /**
     * @dev Retire carbon credits
     */
    function retireCredit(
        uint256 creditId,
        uint256 amount,
        string memory reason
    ) external;
    
    /**
     * @dev Check if credit is valid for trading/retirement
     */
    function isCreditValid(uint256 creditId) external view returns (bool isValid, string memory reason);
    
    /**
     * @dev Get detailed credit information
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
    );
    
    /**
     * @dev Get all credits for a project
     */
    function getProjectCredits(string memory projectId) external view returns (uint256[] memory);
    
    /**
     * @dev Refresh verification for a credit
     */
    function refreshVerification(
        uint256 creditId,
        string memory apiUrl
    ) external returns (bytes32 requestId);
    
    /**
     * @dev Standard ERC20 functions
     */
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    
    /**
     * @dev Enhanced functions for oracle integration
     */
    function getProjectVerificationSummary(string memory projectId) external view returns (
        bool isAuthorized,
        bool isVerified,
        uint256 totalCredits,
        uint256 lastVerificationTime
    );
    
    /**
     * @dev Batch operations
     */
    function batchCompleteMinting(
        uint256[] memory creditIds,
        address[] memory recipients,
        uint256[] memory amounts
    ) external;
    
    // Events
    event CreditMinted(address indexed to, uint256 indexed creditId, uint256 amount, string projectId);
    event CreditRetired(address indexed by, uint256 indexed creditId, uint256 amount, string reason);
    event OracleVerificationRequested(string indexed projectId, bytes32 requestId, uint256 creditId);
    event CreditVerified(uint256 indexed creditId, bool verified, uint256 verifiedAmount);
    event VerificationExpired(uint256 indexed creditId, string projectId);
}