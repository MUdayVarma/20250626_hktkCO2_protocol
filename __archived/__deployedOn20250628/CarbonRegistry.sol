// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ICarbonCreditToken.sol";
import "./CarbonCreditToken.sol";
import "./OracleIntegration.sol";

contract CarbonRegistry is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PROJECT_DEVELOPER_ROLE = keccak256("PROJECT_DEVELOPER_ROLE");
    
    struct ProjectData {
        string projectId;
        string name;
        string location;
        string methodology;
        address developer;
        uint256 totalCredits;
        uint256 issuedCredits;
        bool isActive;
        uint256 registrationDate;
        string ipfsDocumentHash;
        bool requiresOracleVerification;
        uint256 lastOracleVerification;
        string apiEndpoint; // For oracle verification
        ProjectStatus status;
    }
    
    struct VerificationData {
        address verifier;
        uint256 timestamp;
        string reportHash;
        bool isVerified;
        uint256 verifiedAmount;
        uint256 validUntil;
        VerificationType verificationType;
    }
    
    struct ProjectMetrics {
        uint256 totalCreditsGenerated;
        uint256 totalCreditsRetired;
        uint256 averagePrice;
        uint256 lastTradePrice;
        uint256 marketCap;
        uint256 tradingVolume;
    }
    
    enum ProjectStatus {
        REGISTERED,
        UNDER_REVIEW,
        VERIFIED,
        ACTIVE,
        SUSPENDED,
        RETIRED
    }
    
    enum VerificationType {
        MANUAL,
        ORACLE,
        HYBRID
    }
    
    // Oracle integration
    CarbonOracle public carbonOracle;
    CarbonCreditToken public carbonToken;
    
    mapping(string => ProjectData) public projects;
    mapping(string => VerificationData) public verifications;
    mapping(address => string[]) public developerProjects;
    mapping(string => ProjectMetrics) public projectMetrics;
    mapping(string => uint256[]) public projectCredits; // creditIds per project
    mapping(bytes32 => string) public oracleRequestToProject; // Track oracle requests
    
    // Registry statistics
    uint256 public totalRegisteredProjects;
    uint256 public totalVerifiedProjects;
    uint256 public totalActiveProjects;
    
    // Verification settings
    uint256 public verificationValidityPeriod = 365 days; // 1 year
    uint256 public oracleVerificationFee = 0.01 ether;
    
    event ProjectRegistered(string indexed projectId, address indexed developer, string name);
    event ProjectVerified(string indexed projectId, address indexed verifier, VerificationType verificationType);
    event ProjectStatusUpdated(string indexed projectId, ProjectStatus oldStatus, ProjectStatus newStatus);
    event CreditsIssued(string indexed projectId, uint256 creditId, uint256 amount, address recipient);
    event OracleVerificationRequested(string indexed projectId, bytes32 requestId);
    event OracleVerificationCompleted(string indexed projectId, bool verified, uint256 amount);
    event ProjectMetricsUpdated(string indexed projectId, uint256 totalGenerated, uint256 totalRetired);
    
    modifier onlyProjectDeveloper(string memory projectId) {
        require(projects[projectId].developer == msg.sender, "Not project developer");
        _;
    }
    
    modifier projectExists(string memory projectId) {
        require(bytes(projects[projectId].projectId).length != 0, "Project does not exist");
        _;
    }
    
    constructor(address _carbonToken, address _carbonOracle) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        
        carbonToken = CarbonCreditToken(_carbonToken);
        carbonOracle = CarbonOracle(_carbonOracle);
    }
    
    /**
     * @dev Register a new carbon offset project
     */
    function registerProject(
        string memory projectId,
        string memory name,
        string memory location,
        string memory methodology,
        uint256 totalCredits,
        string memory ipfsDocumentHash,
        string memory apiEndpoint
    ) external {
        require(bytes(projects[projectId].projectId).length == 0, "Project already exists");
        require(totalCredits > 0, "Total credits must be greater than 0");
        
        projects[projectId] = ProjectData({
            projectId: projectId,
            name: name,
            location: location,
            methodology: methodology,
            developer: msg.sender,
            totalCredits: totalCredits,
            issuedCredits: 0,
            isActive: false,
            registrationDate: block.timestamp,
            ipfsDocumentHash: ipfsDocumentHash,
            requiresOracleVerification: bytes(apiEndpoint).length > 0,
            lastOracleVerification: 0,
            apiEndpoint: apiEndpoint,
            status: ProjectStatus.REGISTERED
        });
        
        developerProjects[msg.sender].push(projectId);
        totalRegisteredProjects++;
        
        // Grant project developer role
        _grantRole(PROJECT_DEVELOPER_ROLE, msg.sender);
        
        // If API endpoint provided, authorize project for oracle verification
        if (bytes(apiEndpoint).length > 0) {
            carbonOracle.setProjectAuthorization(projectId, true);
        }
        
        emit ProjectRegistered(projectId, msg.sender, name);
    }
    
    /**
     * @dev Request oracle verification for a project
     */
    function requestOracleVerification(
        string memory projectId
    ) external onlyProjectDeveloper(projectId) projectExists(projectId) returns (bytes32 requestId) {
        ProjectData storage project = projects[projectId];
        require(project.requiresOracleVerification, "Project doesn't support oracle verification");
        require(bytes(project.apiEndpoint).length > 0, "No API endpoint configured");
        
        // Update project status
        project.status = ProjectStatus.UNDER_REVIEW;
        
        // Request oracle verification
        requestId = carbonOracle.requestProjectVerification(projectId, project.apiEndpoint);
        oracleRequestToProject[requestId] = projectId;
        
        emit OracleVerificationRequested(projectId, requestId);
        
        return requestId;
    }
    
    /**
     * @dev Complete oracle verification (called by oracle role)
     */
    function completeOracleVerification(
        string memory projectId,
        bool verified,
        uint256 verifiedAmount,
        string memory reportHash
    ) external onlyRole(ORACLE_ROLE) projectExists(projectId) {
        ProjectData storage project = projects[projectId];
        
        // Get oracle verification data
        (bool isOracleVerified, uint256 oracleAmount, uint256 lastUpdate, string memory oracleReportHash, address requester) = 
            carbonOracle.getVerificationStatus(projectId);
        
        require(isOracleVerified, "Oracle verification not confirmed");
        require(requester == project.developer, "Oracle verification requester mismatch");
        
        // Update verification data
        verifications[projectId] = VerificationData({
            verifier: msg.sender,
            timestamp: lastUpdate,
            reportHash: oracleReportHash,
            isVerified: verified,
            verifiedAmount: oracleAmount,
            validUntil: block.timestamp + verificationValidityPeriod,
            verificationType: VerificationType.ORACLE
        });
        
        if (verified) {
            project.isActive = true;
            project.status = ProjectStatus.VERIFIED;
            project.lastOracleVerification = lastUpdate;
            totalVerifiedProjects++;
            totalActiveProjects++;
        } else {
            project.status = ProjectStatus.SUSPENDED;
        }
        
        emit ProjectVerified(projectId, msg.sender, VerificationType.ORACLE);
        emit OracleVerificationCompleted(projectId, verified, oracleAmount);
        
        if (verified) {
            emit ProjectStatusUpdated(projectId, ProjectStatus.UNDER_REVIEW, ProjectStatus.VERIFIED);
        }
    }
    
    /**
     * @dev Manual verification by authorized verifier
     */
    function verifyProjectManually(
        string memory projectId,
        string memory reportHash,
        uint256 verifiedAmount
    ) external onlyRole(VERIFIER_ROLE) projectExists(projectId) {
        ProjectData storage project = projects[projectId];
        
        verifications[projectId] = VerificationData({
            verifier: msg.sender,
            timestamp: block.timestamp,
            reportHash: reportHash,
            isVerified: true,
            verifiedAmount: verifiedAmount,
            validUntil: block.timestamp + verificationValidityPeriod,
            verificationType: VerificationType.MANUAL
        });
        
        ProjectStatus oldStatus = project.status;
        project.isActive = true;
        project.status = ProjectStatus.VERIFIED;
        totalVerifiedProjects++;
        totalActiveProjects++;
        
        emit ProjectVerified(projectId, msg.sender, VerificationType.MANUAL);
        emit ProjectStatusUpdated(projectId, oldStatus, ProjectStatus.VERIFIED);
    }
    
    /**
     * @dev Issue carbon credits for a verified project
     */
    function issueCredits(
        string memory projectId,
        address to,
        uint256 amount,
        string memory registry,
        uint256 vintage,
        string memory ipfsHash
    ) external onlyRole(ORACLE_ROLE) projectExists(projectId) returns (uint256 creditId, bytes32 requestId) {
        ProjectData storage project = projects[projectId];
        VerificationData memory verification = verifications[projectId];
        
        require(project.isActive, "Project not active");
        require(verification.isVerified, "Project not verified");
        require(block.timestamp <= verification.validUntil, "Verification expired");
        require(project.issuedCredits + amount <= project.totalCredits, "Exceeds total credits");
        require(amount <= verification.verifiedAmount, "Exceeds verified amount");
        
        project.issuedCredits += amount;
        
        // Create credit with oracle verification
        (creditId, requestId) = carbonToken.mintCreditWithVerification(
            to,
            amount,
            projectId,
            registry,
            vintage,
            project.methodology,
            ipfsHash,
            project.apiEndpoint
        );
        
        // Track credits for this project
        projectCredits[projectId].push(creditId);
        
        // Update project metrics
        ProjectMetrics storage metrics = projectMetrics[projectId];
        metrics.totalCreditsGenerated += amount;
        
        emit CreditsIssued(projectId, creditId, amount, to);
        emit ProjectMetricsUpdated(projectId, metrics.totalCreditsGenerated, metrics.totalCreditsRetired);
        
        return (creditId, requestId);
    }
    
    /**
     * @dev Update project status
     */
    function updateProjectStatus(
        string memory projectId,
        ProjectStatus newStatus
    ) external onlyRole(DEFAULT_ADMIN_ROLE) projectExists(projectId) {
        ProjectData storage project = projects[projectId];
        ProjectStatus oldStatus = project.status;
        
        project.status = newStatus;
        
        // Update active project count
        if (oldStatus == ProjectStatus.ACTIVE && newStatus != ProjectStatus.ACTIVE) {
            totalActiveProjects--;
        } else if (oldStatus != ProjectStatus.ACTIVE && newStatus == ProjectStatus.ACTIVE) {
            totalActiveProjects++;
        }
        
        emit ProjectStatusUpdated(projectId, oldStatus, newStatus);
    }
    
    /**
     * @dev Get project details with verification status
     */
    function getProjectDetails(string memory projectId) external view returns (
        string memory name,
        string memory location,
        string memory methodology,
        address developer,
        uint256 totalCredits,
        uint256 issuedCredits,
        bool isActive,
        uint256 registrationDate,
        ProjectStatus status,
        bool isVerified,
        uint256 verificationValidUntil,
        VerificationType verificationType
    ) {
        ProjectData memory project = projects[projectId];
        VerificationData memory verification = verifications[projectId];
        
        return (
            project.name,
            project.location,
            project.methodology,
            project.developer,
            project.totalCredits,
            project.issuedCredits,
            project.isActive,
            project.registrationDate,
            project.status,
            verification.isVerified && block.timestamp <= verification.validUntil,
            verification.validUntil,
            verification.verificationType
        );
    }
    
    /**
     * @dev Get project metrics
     */
    function getProjectMetrics(string memory projectId) external view returns (
        uint256 totalCreditsGenerated,
        uint256 totalCreditsRetired,
        uint256 averagePrice,
        uint256 lastTradePrice,
        uint256 marketCap,
        uint256 tradingVolume,
        uint256 utilizationRate
    ) {
        ProjectMetrics memory metrics = projectMetrics[projectId];
        ProjectData memory project = projects[projectId];
        
        uint256 utilization = 0;
        if (project.totalCredits > 0) {
            utilization = (project.issuedCredits * 100) / project.totalCredits;
        }
        
        return (
            metrics.totalCreditsGenerated,
            metrics.totalCreditsRetired,
            metrics.averagePrice,
            metrics.lastTradePrice,
            metrics.marketCap,
            metrics.tradingVolume,
            utilization
        );
    }
    
    /**
     * @dev Get all projects by developer
     */
    function getDeveloperProjects(address developer) external view returns (string[] memory) {
        return developerProjects[developer];
    }
    
    /**
     * @dev Get registry statistics
     */
    function getRegistryStats() external view returns (
        uint256 totalProjects,
        uint256 verifiedProjects,
        uint256 activeProjects,
        uint256 totalCreditsIssued,
        uint256 totalOracleVerifications
    ) {
        uint256 totalIssued = 0;
        uint256 oracleVerificationCount = 0;
        
        // This is expensive for large datasets - consider using events for off-chain aggregation
        for (uint i = 0; i < totalRegisteredProjects; i++) {
            // Would need to iterate through all projects - simplified for demo
        }
        
        return (
            totalRegisteredProjects,
            totalVerifiedProjects,
            totalActiveProjects,
            totalIssued,
            oracleVerificationCount
        );
    }
    
    /**
     * @dev Update project metrics (called by marketplace or retirement contracts)
     */
    function updateProjectTradingMetrics(
        string memory projectId,
        uint256 tradePrice,
        uint256 tradeVolume
    ) external {
        // Only allow calls from authorized contracts (marketplace, etc.)
        require(
            msg.sender == address(carbonToken) || 
            hasRole(ORACLE_ROLE, msg.sender),
            "Unauthorized metrics update"
        );
        
        ProjectMetrics storage metrics = projectMetrics[projectId];
        metrics.lastTradePrice = tradePrice;
        metrics.tradingVolume += tradeVolume;
        
        // Update average price (simplified calculation)
        if (metrics.averagePrice == 0) {
            metrics.averagePrice = tradePrice;
        } else {
            metrics.averagePrice = (metrics.averagePrice + tradePrice) / 2;
        }
        
        // Update market cap
        ProjectData memory project = projects[projectId];
        metrics.marketCap = project.issuedCredits * metrics.averagePrice;
    }
    
    /**
     * @dev Record credit retirement for project metrics
     */
    function recordCreditRetirement(
        string memory projectId,
        uint256 amount
    ) external {
        require(msg.sender == address(carbonToken), "Only carbon token contract");
        
        ProjectMetrics storage metrics = projectMetrics[projectId];
        metrics.totalCreditsRetired += amount;
        
        emit ProjectMetricsUpdated(projectId, metrics.totalCreditsGenerated, metrics.totalCreditsRetired);
    }
    
    /**
     * @dev Check if project verification is current
     */
    function isProjectVerificationCurrent(string memory projectId) external view returns (bool) {
        VerificationData memory verification = verifications[projectId];
        return verification.isVerified && block.timestamp <= verification.validUntil;
    }
    
    /**
     * @dev Renew project verification
     */
    function renewProjectVerification(
        string memory projectId
    ) external onlyProjectDeveloper(projectId) payable returns (bytes32 requestId) {
        require(msg.value >= oracleVerificationFee, "Insufficient verification fee");
        
        ProjectData storage project = projects[projectId];
        require(project.requiresOracleVerification, "Project doesn't support oracle verification");
        
        // Request new oracle verification
        requestId = carbonOracle.requestProjectVerification(projectId, project.apiEndpoint);
        oracleRequestToProject[requestId] = projectId;
        
        project.status = ProjectStatus.UNDER_REVIEW;
        
        emit OracleVerificationRequested(projectId, requestId);
        
        return requestId;
    }
    
    /**
     * @dev Update oracle verification fee
     */
    function setOracleVerificationFee(uint256 _fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        oracleVerificationFee = _fee;
    }
    
    /**
     * @dev Update verification validity period
     */
    function setVerificationValidityPeriod(uint256 _period) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_period >= 30 days && _period <= 1095 days, "Invalid validity period"); // 30 days to 3 years
        verificationValidityPeriod = _period;
    }
    
    /**
     * @dev Update oracle contract
     */
    function updateOracleContract(address _newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        carbonOracle = CarbonOracle(_newOracle);
    }
    
    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
}