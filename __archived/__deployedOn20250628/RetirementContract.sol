// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ICarbonCreditToken.sol";
import "./CarbonCreditToken.sol";
import "./OracleIntegration.sol";
import "./CarbonRegistry.sol";

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
        uint256[] creditIds; // Specific credits being retired
        string projectId;
        bool oracleVerified;
        uint256 retirementPrice; // Price at time of retirement
        RetirementType retirementType;
    }
    
    struct RetirementCertificate {
        uint256 retirementId;
        string certificateHash; // IPFS hash of certificate
        uint256 issuedDate;
        address issuer;
        bool isValid;
    }
    
    struct CompanyRetirementProfile {
        string companyName;
        uint256 totalRetired;
        uint256 targetAmount;
        uint256 retirementGoalYear;
        string sustainabilityReportHash;
        bool isVerifiedCompany;
        uint256 lastRetirementDate;
    }
    
    enum RetirementType {
        VOLUNTARY,
        COMPLIANCE,
        OFFSETTING,
        CSR // Corporate Social Responsibility
    }
    
    CarbonCreditToken public carbonToken;
    CarbonOracle public carbonOracle;
    CarbonRegistry public carbonRegistry;
    
    mapping(uint256 => RetirementRecord) public retirements;
    mapping(address => uint256[]) public userRetirements;
    mapping(string => uint256) public companyRetirements; // company name => total retired
    mapping(string => CompanyRetirementProfile) public companyProfiles;
    mapping(uint256 => RetirementCertificate) public certificates;
    mapping(string => uint256[]) public projectRetirements; // project => retirement IDs
    mapping(bytes32 => uint256) public oracleRequestToRetirement; // Track oracle verification requests
    
    uint256 public nextRetirementId;
    uint256 public totalRetired;
    uint256 public totalRetirements;
    uint256 public retirementVerificationFee = 0.005 ether;
    
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant CERTIFICATE_ISSUER_ROLE = keccak256("CERTIFICATE_ISSUER_ROLE");
    
    // Events
    event CarbonRetired(
        uint256 indexed retirementId,
        address indexed retiree,
        uint256 amount,
        string reason,
        string projectId,
        RetirementType retirementType
    );
    
    event RetirementVerified(
        uint256 indexed retirementId, 
        address indexed verifier,
        bool oracleVerified
    );
    
    event RetirementCertificateIssued(
        uint256 indexed retirementId,
        string certificateHash,
        address indexed issuer
    );
    
    event CompanyProfileUpdated(
        string indexed companyName,
        uint256 totalRetired,
        uint256 targetAmount
    );
    
    event OracleRetirementVerificationRequested(
        uint256 indexed retirementId,
        bytes32 requestId,
        string projectId
    );
    
    modifier validRetirement(uint256 retirementId) {
        require(retirementId < nextRetirementId, "Retirement does not exist");
        _;
    }
    
    constructor(
        address _carbonToken,
        address _carbonOracle,
        address _carbonRegistry
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(CERTIFICATE_ISSUER_ROLE, msg.sender);
        
        carbonToken = CarbonCreditToken(_carbonToken);
        carbonOracle = CarbonOracle(_carbonOracle);
        carbonRegistry = CarbonRegistry(_carbonRegistry);
    }
    
    /**
     * @dev Retire carbon credits with enhanced verification
     */
    function retireCredits(
        uint256 amount,
        string memory reason,
        string memory beneficiary,
        uint256[] memory creditIds,
        RetirementType retirementType
    ) public payable returns (uint256 retirementId) {
        require(amount > 0, "Amount must be greater than 0");
        require(carbonToken.balanceOf(msg.sender) >= amount * 1e18, "Insufficient balance");
        require(creditIds.length > 0, "Must specify credit IDs to retire");
        
        // Validate credits and check verification status
        string memory projectId = "";
        uint256 totalCreditAmount = 0;
        bool allCreditsValid = true;
        
        for (uint i = 0; i < creditIds.length; i++) {
            (bool isValid, string memory reason_) = carbonToken.isCreditValid(creditIds[i]);
            if (!isValid) {
                allCreditsValid = false;
            }
            
            // Get credit details
            (string memory creditProjectId,,,,,,,, uint256 verifiedAmount,,) = carbonToken.getCreditDetails(creditIds[i]);
            
            if (i == 0) {
                projectId = creditProjectId;
            } else {
                require(
                    keccak256(bytes(projectId)) == keccak256(bytes(creditProjectId)),
                    "All credits must be from the same project"
                );
            }
            
            totalCreditAmount += verifiedAmount;
        }
        
        require(totalCreditAmount >= amount, "Credit amount insufficient for retirement");
        
        retirementId = nextRetirementId++;
        
        // Get current market price for retirement record
        uint256 currentPrice = 0;
        try carbonOracle.getLatestPrice() returns (int price) {
            currentPrice = uint256(price);
        } catch {
            currentPrice = 0; // Fallback if price feed fails
        }
        
        retirements[retirementId] = RetirementRecord({
            retirementId: retirementId,
            retiree: msg.sender,
            amount: amount,
            reason: reason,
            beneficiary: beneficiary,
            timestamp: block.timestamp,
            proofHash: "",
            isVerified: false,
            creditIds: creditIds,
            projectId: projectId,
            oracleVerified: false,
            retirementPrice: currentPrice,
            retirementType: retirementType
        });
        
        userRetirements[msg.sender].push(retirementId);
        companyRetirements[beneficiary] += amount;
        projectRetirements[projectId].push(retirementId);
        totalRetired += amount;
        totalRetirements++;
        
        // Update company profile
        CompanyRetirementProfile storage profile = companyProfiles[beneficiary];
        if (bytes(profile.companyName).length == 0) {
            profile.companyName = beneficiary;
        }
        profile.totalRetired += amount;
        profile.lastRetirementDate = block.timestamp;
        
        // Retire the credits through the carbon token contract
        carbonToken.retireCredit(creditIds[0], amount, reason); // Simplified - in practice, handle multiple credits
        
        // Update project metrics in registry
        carbonRegistry.recordCreditRetirement(projectId, amount);
        
        // Request oracle verification if payment provided and credits require verification
        if (msg.value >= retirementVerificationFee && !allCreditsValid) {
            requestOracleRetirementVerification(retirementId);
        }
        
        emit CarbonRetired(retirementId, msg.sender, amount, reason, projectId, retirementType);
        emit CompanyProfileUpdated(beneficiary, profile.totalRetired, profile.targetAmount);
        
        return retirementId;
    }
    
    /**
     * @dev Request oracle verification for retirement
     */
    function requestOracleRetirementVerification(
        uint256 retirementId
    ) public payable validRetirement(retirementId) returns (bytes32 requestId) {
        require(msg.value >= retirementVerificationFee, "Insufficient verification fee");
        
        RetirementRecord storage retirement = retirements[retirementId];
        require(retirement.retiree == msg.sender || hasRole(VERIFIER_ROLE, msg.sender), "Unauthorized");
        require(!retirement.oracleVerified, "Already oracle verified");
        
        // Check if project supports oracle verification
        (bool isAuthorized) = carbonOracle.isProjectAuthorized(retirement.projectId);
        require(isAuthorized, "Project not authorized for oracle verification");
        
        // Get project API endpoint from registry (simplified - would need registry method)
        string memory apiUrl = ""; // Would get from registry
        
        // Request verification
        requestId = carbonOracle.requestProjectVerification(retirement.projectId, apiUrl);
        oracleRequestToRetirement[requestId] = retirementId;
        
        emit OracleRetirementVerificationRequested(retirementId, requestId, retirement.projectId);
        
        return requestId;
    }
    
    /**
     * @dev Complete oracle verification for retirement
     */
    function completeOracleRetirementVerification(
        uint256 retirementId,
        bool verified
    ) external onlyRole(VERIFIER_ROLE) validRetirement(retirementId) {
        RetirementRecord storage retirement = retirements[retirementId];
        
        // Verify oracle status
        (bool isOracleVerified,,,, address requester) = carbonOracle.getVerificationStatus(retirement.projectId);
        require(isOracleVerified, "Oracle verification not confirmed");
        
        retirement.oracleVerified = verified;
        retirement.isVerified = verified;
        
        emit RetirementVerified(retirementId, msg.sender, true);
    }
    
    /**
     * @dev Manual verification of retirement
     */
    function verifyRetirement(
        uint256 retirementId,
        string memory proofHash
    ) external onlyRole(VERIFIER_ROLE) validRetirement(retirementId) {
        RetirementRecord storage retirement = retirements[retirementId];
        require(!retirement.isVerified, "Already verified");
        
        retirement.proofHash = proofHash;
        retirement.isVerified = true;
        
        emit RetirementVerified(retirementId, msg.sender, false);
    }
    
    /**
     * @dev Issue retirement certificate
     */
    function issueRetirementCertificate(
        uint256 retirementId,
        string memory certificateHash
    ) external onlyRole(CERTIFICATE_ISSUER_ROLE) validRetirement(retirementId) {
        RetirementRecord memory retirement = retirements[retirementId];
        require(retirement.isVerified, "Retirement not verified");
        require(!certificates[retirementId].isValid, "Certificate already issued");
        
        certificates[retirementId] = RetirementCertificate({
            retirementId: retirementId,
            certificateHash: certificateHash,
            issuedDate: block.timestamp,
            issuer: msg.sender,
            isValid: true
        });
        
        emit RetirementCertificateIssued(retirementId, certificateHash, msg.sender);
    }
    
    /**
     * @dev Set up company retirement profile
     */
    function setupCompanyProfile(
        string memory companyName,
        uint256 targetAmount,
        uint256 goalYear,
        string memory sustainabilityReportHash
    ) external {
        CompanyRetirementProfile storage profile = companyProfiles[companyName];
        
        profile.companyName = companyName;
        profile.targetAmount = targetAmount;
        profile.retirementGoalYear = goalYear;
        profile.sustainabilityReportHash = sustainabilityReportHash;
        
        emit CompanyProfileUpdated(companyName, profile.totalRetired, targetAmount);
    }
    
    /**
     * @dev Verify company profile
     */
    function verifyCompanyProfile(
        string memory companyName,
        bool isVerified
    ) external onlyRole(VERIFIER_ROLE) {
        companyProfiles[companyName].isVerifiedCompany = isVerified;
    }
    
    /**
     * @dev Get retirement proof with full details
     */
    function getRetirementProof(uint256 retirementId) external view validRetirement(retirementId) returns (
        address retiree,
        uint256 amount,
        string memory reason,
        string memory beneficiary,
        uint256 timestamp,
        string memory proofHash,
        bool isVerified,
        uint256[] memory creditIds,
        string memory projectId,
        bool oracleVerified,
        uint256 retirementPrice,
        RetirementType retirementType
    ) {
        RetirementRecord memory retirement = retirements[retirementId];
        return (
            retirement.retiree,
            retirement.amount,
            retirement.reason,
            retirement.beneficiary,
            retirement.timestamp,
            retirement.proofHash,
            retirement.isVerified,
            retirement.creditIds,
            retirement.projectId,
            retirement.oracleVerified,
            retirement.retirementPrice,
            retirement.retirementType
        );
    }
    
    /**
     * @dev Get retirement certificate
     */
    function getRetirementCertificate(uint256 retirementId) external view validRetirement(retirementId) returns (
        string memory certificateHash,
        uint256 issuedDate,
        address issuer,
        bool isValid
    ) {
        RetirementCertificate memory certificate = certificates[retirementId];
        return (
            certificate.certificateHash,
            certificate.issuedDate,
            certificate.issuer,
            certificate.isValid
        );
    }
    
    /**
     * @dev Get user retirement history
     */
    function getUserRetirements(address user) external view returns (uint256[] memory) {
        return userRetirements[user];
    }
    
    /**
     * @dev Get company retirement statistics
     */
    function getCompanyRetirementStats(string memory companyName) external view returns (
        uint256 totalRetired,
        uint256 targetAmount,
        uint256 retirementGoalYear,
        string memory sustainabilityReportHash,
        bool isVerifiedCompany,
        uint256 lastRetirementDate,
        uint256 progressPercentage
    ) {
        CompanyRetirementProfile memory profile = companyProfiles[companyName];
        
        uint256 progress = 0;
        if (profile.targetAmount > 0) {
            progress = (profile.totalRetired * 100) / profile.targetAmount;
        }
        
        return (
            profile.totalRetired,
            profile.targetAmount,
            profile.retirementGoalYear,
            profile.sustainabilityReportHash,
            profile.isVerifiedCompany,
            profile.lastRetirementDate,
            progress
        );
    }
    
    /**
     * @dev Get project retirement statistics
     */
    function getProjectRetirementStats(string memory projectId) external view returns (
        uint256 totalRetirements,
        uint256 totalAmountRetired,
        uint256 averageRetirementSize,
        uint256 lastRetirementDate
    ) {
        uint256[] memory retirementIds = projectRetirements[projectId];
        uint256 totalAmount = 0;
        uint256 lastDate = 0;
        
        for (uint i = 0; i < retirementIds.length; i++) {
            RetirementRecord memory retirement = retirements[retirementIds[i]];
            totalAmount += retirement.amount;
            if (retirement.timestamp > lastDate) {
                lastDate = retirement.timestamp;
            }
        }
        
        uint256 averageSize = 0;
        if (retirementIds.length > 0) {
            averageSize = totalAmount / retirementIds.length;
        }
        
        return (
            retirementIds.length,
            totalAmount,
            averageSize,
            lastDate
        );
    }
    
    /**
     * @dev Get global retirement statistics
     */
    function getGlobalRetirementStats() external view returns (
        uint256 totalRetirementsCount,
        uint256 totalAmountRetired,
        uint256 averageRetirementSize,
        uint256 verifiedRetirements,
        uint256 oracleVerifiedRetirements
    ) {
        uint256 verifiedCount = 0;
        uint256 oracleVerifiedCount = 0;
        
        // This is expensive for large datasets - consider using events for off-chain aggregation
        for (uint i = 0; i < nextRetirementId; i++) {
            if (retirements[i].isVerified) {
                verifiedCount++;
            }
            if (retirements[i].oracleVerified) {
                oracleVerifiedCount++;
            }
        }
        
        uint256 averageSize = 0;
        if (totalRetirements > 0) {
            averageSize = totalRetired / totalRetirements;
        }
        
        return (
            totalRetirements,
            totalRetired,
            averageSize,
            verifiedCount,
            oracleVerifiedCount
        );
    }
    
    /**
     * @dev Batch retire credits for multiple projects
     */
    function batchRetireCredits(
        uint256[] memory amounts,
        string[] memory reasons,
        string[] memory beneficiaries,
        uint256[][] memory creditIdArrays,
        RetirementType[] memory retirementTypes
    ) external returns (uint256[] memory retirementIds) {
        require(
            amounts.length == reasons.length &&
            reasons.length == beneficiaries.length &&
            beneficiaries.length == creditIdArrays.length &&
            creditIdArrays.length == retirementTypes.length,
            "Array length mismatch"
        );
        
        retirementIds = new uint256[](amounts.length);
        
        for (uint i = 0; i < amounts.length; i++) {
            retirementIds[i] = retireCredits(
                amounts[i],
                reasons[i],
                beneficiaries[i],
                creditIdArrays[i],
                retirementTypes[i]
            );
        }
        
        return retirementIds;
    }
    
    /**
     * @dev Set retirement verification fee
     */
    function setRetirementVerificationFee(uint256 _fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        retirementVerificationFee = _fee;
    }
    
    /**
     * @dev Update oracle contract
     */
    function updateOracleContract(address _newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        carbonOracle = CarbonOracle(_newOracle);
    }
    
    /**
     * @dev Update registry contract
     */
    function updateRegistryContract(address _newRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        carbonRegistry = CarbonRegistry(_newRegistry);
    }
    
    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    /**
     * @dev Revoke retirement certificate (in case of fraud)
     */
    function revokeCertificate(uint256 retirementId) external onlyRole(DEFAULT_ADMIN_ROLE) validRetirement(retirementId) {
        certificates[retirementId].isValid = false;
    }
}