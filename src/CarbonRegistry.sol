// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ICarbonCreditToken.sol";

contract CarbonRegistry is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
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
    }
    
    struct VerificationData {
        address verifier;
        uint256 timestamp;
        string reportHash;
        bool isVerified;
    }
    
    mapping(string => ProjectData) public projects;
    mapping(string => VerificationData) public verifications;
    mapping(address => string[]) public developerProjects;
    
    ICarbonCreditToken public carbonToken;
    
    event ProjectRegistered(string indexed projectId, address indexed developer);
    event ProjectVerified(string indexed projectId, address indexed verifier);
    event CreditsIssued(string indexed projectId, uint256 amount);
    
    constructor(address _carbonToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        carbonToken = ICarbonCreditToken(_carbonToken);
    }
    
    function registerProject(
        string memory projectId,
        string memory name,
        string memory location,
        string memory methodology,
        uint256 totalCredits
    ) external {
        require(bytes(projects[projectId].projectId).length == 0, "Project already exists");
        
        projects[projectId] = ProjectData({
            projectId: projectId,
            name: name,
            location: location,
            methodology: methodology,
            developer: msg.sender,
            totalCredits: totalCredits,
            issuedCredits: 0,
            isActive: false,
            registrationDate: block.timestamp
        });
        
        developerProjects[msg.sender].push(projectId);
        
        emit ProjectRegistered(projectId, msg.sender);
    }
    
    function verifyProject(
        string memory projectId,
        string memory reportHash
    ) external onlyRole(ORACLE_ROLE) {
        require(bytes(projects[projectId].projectId).length != 0, "Project does not exist");
        
        verifications[projectId] = VerificationData({
            verifier: msg.sender,
            timestamp: block.timestamp,
            reportHash: reportHash,
            isVerified: true
        });
        
        projects[projectId].isActive = true;
        
        emit ProjectVerified(projectId, msg.sender);
    }
    
    function issueCredits(
        string memory projectId,
        address to,
        uint256 amount,
        string memory registry,
        uint256 vintage,
        string memory ipfsHash
    ) external onlyRole(ORACLE_ROLE) {
        ProjectData storage project = projects[projectId];
        require(project.isActive, "Project not verified");
        require(project.issuedCredits + amount <= project.totalCredits, "Exceeds total credits");
        
        project.issuedCredits += amount;
        
        carbonToken.mintCredit(
            to,
            amount,
            projectId,
            registry,
            vintage,
            project.methodology,
            ipfsHash
        );
        
        emit CreditsIssued(projectId, amount);
    }
}