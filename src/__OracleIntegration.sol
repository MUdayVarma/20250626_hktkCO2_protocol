// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";

contract CarbonOracle is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    struct ProjectVerification {
        string projectId;
        bool isVerified;
        uint256 verifiedAmount;
        uint256 lastUpdate;
        string reportHash;
        address requester;
    }

    mapping(string => ProjectVerification) public verifications;
    mapping(bytes32 => string) public requestToProject;
    mapping(string => bool) public authorizedProjects;

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    // Price feed for carbon credit pricing (if needed)
    AggregatorV3Interface internal priceFeed;

    event ProjectVerificationRequested(
        string indexed projectId,
        bytes32 requestId,
        address requester
    );
    event ProjectVerificationReceived(
        string indexed projectId,
        bool verified,
        uint256 amount
    );
    event ProjectAuthorized(string indexed projectId, bool authorized);
    event OracleConfigUpdated(address oracle, bytes32 jobId, uint256 fee);

    modifier onlyAuthorizedProject(string memory projectId) {
        require(authorizedProjects[projectId], "Project not authorized");
        _;
    }

    constructor() ConfirmedOwner(msg.sender) {
        _setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB); // Sepolia LINK
        oracle = 0xCC79157eb46F5624204f47AB42b3906cAA40eaB7; // Sepolia Oracle
        jobId = "ca98366cc7314957b8c012c72f05aeeb"; // GET request job
        fee = 0.1 * 10 ** 18; // 0.1 LINK

        // Sepolia ETH/USD price feed (optional for carbon pricing)
        priceFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
    }

    /**
     * @dev Request verification for a carbon offset project
     * @param projectId Unique identifier for the project
     * @param apiUrl URL endpoint to fetch verification data
     */
    function requestProjectVerification(
        string memory projectId,
        string memory apiUrl
    ) public onlyAuthorizedProject(projectId) returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );

        req._add("get", apiUrl);
        req._add("path", "verified");
        req._addInt("times", 1);

        requestId = _sendChainlinkRequest(req, fee);
        requestToProject[requestId] = projectId;

        // Initialize or update the verification record
        verifications[projectId].projectId = projectId;
        verifications[projectId].requester = msg.sender;

        emit ProjectVerificationRequested(projectId, requestId, msg.sender);

        return requestId;
    }

    /**
     * @dev Callback function used by Chainlink oracle
     * @param requestId The request ID
     * @param verified Whether the project is verified
     */
    function fulfill(
        bytes32 requestId,
        bool verified
    ) public recordChainlinkFulfillment(requestId) {
        string memory projectId = requestToProject[requestId];
        require(bytes(projectId).length > 0, "Invalid request ID");

        ProjectVerification storage verification = verifications[projectId];
        verification.isVerified = verified;
        verification.lastUpdate = block.timestamp;

        emit ProjectVerificationReceived(
            projectId,
            verified,
            verification.verifiedAmount
        );
    }

    /**
     * @dev Advanced verification with amount and report hash
     * @param projectId Project identifier
     * @param apiUrl API endpoint
     * @param amountPath JSON path for verified amount
     * @param hashPath JSON path for report hash
     */
    function requestDetailedVerification(
        string memory projectId,
        string memory apiUrl,
        string memory amountPath,
        string memory hashPath
    ) public onlyAuthorizedProject(projectId) returns (bytes32 requestId) {
        Chainlink.Request memory req = _buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillDetailed.selector
        );

        req._add("get", apiUrl);
        req._add("path", "verified");
        req._add("amountPath", amountPath);
        req._add("hashPath", hashPath);

        requestId = _sendChainlinkRequest(req, fee);
        requestToProject[requestId] = projectId;

        verifications[projectId].projectId = projectId;
        verifications[projectId].requester = msg.sender;

        emit ProjectVerificationRequested(projectId, requestId, msg.sender);

        return requestId;
    }

    /**
     * @dev Detailed callback with amount and hash
     */
    function fulfillDetailed(
        bytes32 requestId,
        bool verified,
        uint256 amount,
        string memory reportHash
    ) public recordChainlinkFulfillment(requestId) {
        string memory projectId = requestToProject[requestId];
        require(bytes(projectId).length > 0, "Invalid request ID");

        ProjectVerification storage verification = verifications[projectId];
        verification.isVerified = verified;
        verification.verifiedAmount = amount;
        verification.reportHash = reportHash;
        verification.lastUpdate = block.timestamp;

        emit ProjectVerificationReceived(projectId, verified, amount);
    }

    /**
     * @dev Get the latest verification status for a project
     * @param projectId Project identifier
     */
    function getVerificationStatus(
        string memory projectId
    )
        public
        view
        returns (
            bool isVerified,
            uint256 verifiedAmount,
            uint256 lastUpdate,
            string memory reportHash,
            address requester
        )
    {
        ProjectVerification memory verification = verifications[projectId];
        return (
            verification.isVerified,
            verification.verifiedAmount,
            verification.lastUpdate,
            verification.reportHash,
            verification.requester
        );
    }

    /**
     * @dev Check if verification is recent (within specified time)
     * @param projectId Project identifier
     * @param maxAge Maximum age in seconds
     */
    function isVerificationCurrent(
        string memory projectId,
        uint256 maxAge
    ) public view returns (bool) {
        ProjectVerification memory verification = verifications[projectId];
        return
            verification.lastUpdate > 0 &&
            (block.timestamp - verification.lastUpdate) <= maxAge;
    }

    /**
     * @dev Get the latest ETH/USD price (for carbon pricing calculations)
     */
    function getLatestPrice() public view returns (int) {
        (
            ,
            // uint80 roundID
            int price, // uint startedAt // uint timeStamp
            ,
            ,

        ) = // uint80 answeredInRound
            priceFeed.latestRoundData();
        return price;
    }

    /**
     * @dev Authorize a project for verification requests
     * @param projectId Project identifier
     * @param authorized Whether the project is authorized
     */
    function setProjectAuthorization(
        string memory projectId,
        bool authorized
    ) public onlyOwner {
        authorizedProjects[projectId] = authorized;
        emit ProjectAuthorized(projectId, authorized);
    }

    /**
     * @dev Update oracle configuration
     * @param _oracle Oracle address
     * @param _jobId Job ID
     * @param _fee Fee amount
     */
    function updateOracleConfig(
        address _oracle,
        bytes32 _jobId,
        uint256 _fee
    ) public onlyOwner {
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
        emit OracleConfigUpdated(_oracle, _jobId, _fee);
    }

    /**
     * @dev Withdraw LINK tokens
     */
    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }

    /**
     * @dev Get contract's LINK balance
     */
    function getLinkBalance() public view returns (uint256) {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        return link.balanceOf(address(this));
    }

    /**
     * @dev Emergency function to cancel a request
     * @param requestId The request ID to cancel
     */
    function cancelRequest(bytes32 requestId) public onlyOwner {
        _cancelChainlinkRequest(
            requestId,
            fee,
            this.fulfill.selector,
            block.timestamp
        );
    }

    /**
     * @dev Batch authorization of multiple projects
     * @param projectIds Array of project identifiers
     * @param authorized Authorization status for all projects
     */
    function batchAuthorizeProjects(
        string[] memory projectIds,
        bool authorized
    ) public onlyOwner {
        for (uint i = 0; i < projectIds.length; i++) {
            authorizedProjects[projectIds[i]] = authorized;
            emit ProjectAuthorized(projectIds[i], authorized);
        }
    }

    /**
     * @dev Check if a project is authorized
     * @param projectId Project identifier
     */
    function isProjectAuthorized(
        string memory projectId
    ) public view returns (bool) {
        return authorizedProjects[projectId];
    }

    /**
     * @dev Get current oracle configuration
     */
    function getOracleConfig() public view returns (address, bytes32, uint256) {
        return (oracle, jobId, fee);
    }
}
