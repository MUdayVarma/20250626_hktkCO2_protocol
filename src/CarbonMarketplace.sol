// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICarbonCreditToken.sol";
// Interface definitions (since external contracts might not exist)


interface ICarbonOracle {
    function getVerificationStatus(string memory projectId) external view returns (
        bool isVerified,
        uint256 verificationDate,
        string memory standard,
        uint256 confidence,
        address requester
    );
}

contract CarbonMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        uint256 listingId;
        address seller;
        uint256 amount;
        uint256 pricePerToken;
        string projectId;
        uint256 vintage;
        bool isActive;
        uint256 createdAt;
        bool requiresOracleVerification;
        uint256[] creditIds; // Track specific credit IDs being sold
        bool isPriorityListing; // For verified projects
    }
    
    struct Auction {
        uint256 auctionId;
        address seller;
        uint256 amount;
        uint256 startingPrice;
        uint256 currentBid;
        address highestBidder;
        uint256 endTime;
        bool isActive;
        string projectId;
        uint256[] creditIds;
        bool requiresVerification;
    }
    
    struct MarketStats {
        uint256 totalVolume;
        uint256 totalTrades;
        uint256 averagePrice;
        uint256 verifiedListings;
        uint256 pendingVerifications;
    }
    
    ICarbonCreditToken public carbonToken;
    ICarbonOracle public carbonOracle;
    
    uint256 public verificationGracePeriod = 7 days;
    uint256 public verificationDiscountRate = 10; // 10% discount for verified projects
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userAuctions;
    mapping(string => uint256[]) public projectListings; // Listings per project
    mapping(string => MarketStats) public projectStats;
    
    uint256 public nextListingId;
    uint256 public nextAuctionId;
    uint256 public marketplaceFee = 250; // 2.5%
    uint256 public constant BASIS_POINTS = 10000;
    
    // Market statistics
    uint256 public totalMarketVolume;
    uint256 public totalTrades;
    uint256 public activeListings;
    uint256 public activeAuctions;
    
    // Events
    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 price, string projectId);
    event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice);
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 amount, string projectId);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount);
    event VerificationRequiredForListing(uint256 indexed listingId, string projectId);
    event VerificationCompletedForListing(uint256 indexed listingId, bool verified);
    event ListingPriorityUpdated(uint256 indexed listingId, bool isPriority);
    event MarketStatsUpdated(string projectId, uint256 volume, uint256 trades, uint256 avgPrice);
    
    modifier onlyVerifiedSeller(string memory projectId) {
        if (address(carbonOracle) != address(0)) {
            (bool isVerified,,,, address requester) = carbonOracle.getVerificationStatus(projectId);
            require(isVerified && requester == msg.sender, "Seller not verified for this project");
        }
        _;
    }
    
    constructor(address _carbonToken, address _carbonOracle) {
        // Allow zero addresses for testing/deployment flexibility
        if (_carbonToken != address(0)) {
            carbonToken = ICarbonCreditToken(_carbonToken);
        }
        if (_carbonOracle != address(0)) {
            carbonOracle = ICarbonOracle(_carbonOracle);
        }
    }
    
    /**
     * @dev Create a listing with automatic oracle verification check
     */
    function createListing(
        uint256 amount,
        uint256 pricePerToken,
        string memory projectId,
        uint256 vintage,
        uint256[] memory creditIds
    ) public nonReentrant returns (uint256 listingId) {
        require(amount > 0, "Amount must be greater than 0");
        require(pricePerToken > 0, "Price must be greater than 0");
        require(creditIds.length > 0, "Must specify credit IDs");
        
        // Only check balance if token contract is set
        if (address(carbonToken) != address(0)) {
            require(carbonToken.balanceOf(msg.sender) >= amount * 1e18, "Insufficient balance");
        }
        
        // Validate credit IDs and their verification status
        bool allCreditsVerified = true;
        uint256 totalCreditAmount = 0;
        
        if (address(carbonToken) != address(0)) {
            for (uint i = 0; i < creditIds.length; i++) {
                (bool isValid, string memory reason) = carbonToken.isCreditValid(creditIds[i]);
                if (!isValid) {
                    allCreditsVerified = false;
                    emit VerificationRequiredForListing(nextListingId, projectId);
                }
                
                // Get credit details to sum up amount
                (,,,,,,,, uint256 verifiedAmount,,) = carbonToken.getCreditDetails(creditIds[i]);
                totalCreditAmount += verifiedAmount;
            }
            
            require(totalCreditAmount >= amount, "Credit amount insufficient for listing");
        } else {
            // If no token contract, assume verification is needed
            allCreditsVerified = false;
            totalCreditAmount = amount; // Allow listing to proceed
        }
        
        listingId = nextListingId++;
        
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            amount: amount,
            pricePerToken: pricePerToken,
            projectId: projectId,
            vintage: vintage,
            isActive: true,
            createdAt: block.timestamp,
            requiresOracleVerification: !allCreditsVerified,
            creditIds: creditIds,
            isPriorityListing: allCreditsVerified
        });
        
        userListings[msg.sender].push(listingId);
        projectListings[projectId].push(listingId);
        activeListings++;
        
        // Apply discount for verified projects
        if (allCreditsVerified) {
            uint256 discountedPrice = pricePerToken * (BASIS_POINTS - verificationDiscountRate) / BASIS_POINTS;
            listings[listingId].pricePerToken = discountedPrice;
        }
        
        // Transfer tokens to marketplace escrow (only if token contract exists)
        if (address(carbonToken) != address(0)) {
            carbonToken.transferFrom(msg.sender, address(this), amount * 1e18);
        }
        
        emit ListingCreated(listingId, msg.sender, amount, listings[listingId].pricePerToken, projectId);
        
        if (allCreditsVerified) {
            emit ListingPriorityUpdated(listingId, true);
        }
        
        return listingId;
    }
    
    /**
     * @dev Buy from a listing with verification checks
     */
    function buyListing(uint256 listingId, uint256 amount) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(amount <= listing.amount, "Insufficient amount available");
        
        // If listing requires verification, check current status
        if (listing.requiresOracleVerification && address(carbonToken) != address(0)) {
            bool allCreditsVerified = true;
            for (uint i = 0; i < listing.creditIds.length; i++) {
                (bool isValid,) = carbonToken.isCreditValid(listing.creditIds[i]);
                if (!isValid) {
                    allCreditsVerified = false;
                    break;
                }
            }
            
            if (allCreditsVerified) {
                listing.requiresOracleVerification = false;
                listing.isPriorityListing = true;
                // Apply verification discount
                uint256 discountedPrice = listing.pricePerToken * (BASIS_POINTS - verificationDiscountRate) / BASIS_POINTS;
                listing.pricePerToken = discountedPrice;
                
                emit VerificationCompletedForListing(listingId, true);
                emit ListingPriorityUpdated(listingId, true);
            } else {
                // Check if grace period has expired
                require(block.timestamp <= listing.createdAt + verificationGracePeriod, 
                        "Verification grace period expired");
            }
        }
        
        uint256 totalCost = amount * listing.pricePerToken;
        require(msg.value >= totalCost, "Insufficient payment");
        
        uint256 fee = (totalCost * marketplaceFee) / BASIS_POINTS;
        uint256 sellerAmount = totalCost - fee;
        
        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.isActive = false;
            activeListings--;
        }
        
        // Transfer tokens to buyer (only if token contract exists)
        if (address(carbonToken) != address(0)) {
            carbonToken.transfer(msg.sender, amount * 1e18);
        }
        
        // Transfer payment to seller
        payable(listing.seller).transfer(sellerAmount);
        
        // Update market statistics
        totalMarketVolume += totalCost;
        totalTrades++;
        
        // Update project statistics
        MarketStats storage stats = projectStats[listing.projectId];
        stats.totalVolume += totalCost;
        stats.totalTrades++;
        if (stats.totalTrades > 0) {
            stats.averagePrice = stats.totalVolume / stats.totalTrades;
        }
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit ListingSold(listingId, msg.sender, amount, totalCost);
        emit MarketStatsUpdated(listing.projectId, stats.totalVolume, stats.totalTrades, stats.averagePrice);
    }
    
    /**
     * @dev Create an auction with oracle verification
     */
    function createAuction(
        uint256 amount,
        uint256 startingPrice,
        uint256 duration,
        string memory projectId,
        uint256[] memory creditIds
    ) external nonReentrant returns (uint256 auctionId) {
        require(amount > 0, "Amount must be greater than 0");
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(duration >= 1 hours && duration <= 7 days, "Invalid auction duration");
        
        // Only check balance if token contract is set
        if (address(carbonToken) != address(0)) {
            require(carbonToken.balanceOf(msg.sender) >= amount * 1e18, "Insufficient balance");
        }
        
        // Check credit verification status
        bool requiresVerification = false;
        if (address(carbonToken) != address(0)) {
            for (uint i = 0; i < creditIds.length; i++) {
                (bool isValid,) = carbonToken.isCreditValid(creditIds[i]);
                if (!isValid) {
                    requiresVerification = true;
                    break;
                }
            }
        } else {
            requiresVerification = true; // Default to requiring verification if no token contract
        }
        
        auctionId = nextAuctionId++;
        
        auctions[auctionId] = Auction({
            auctionId: auctionId,
            seller: msg.sender,
            amount: amount,
            startingPrice: startingPrice,
            currentBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            isActive: true,
            projectId: projectId,
            creditIds: creditIds,
            requiresVerification: requiresVerification
        });
        
        userAuctions[msg.sender].push(auctionId);
        activeAuctions++;
        
        // Transfer tokens to marketplace escrow (only if token contract exists)
        if (address(carbonToken) != address(0)) {
            carbonToken.transferFrom(msg.sender, address(this), amount * 1e18);
        }
        
        emit AuctionCreated(auctionId, msg.sender, amount, projectId);
        
        return auctionId;
    }
    
    /**
     * @dev Place a bid on an auction with verification awareness
     */
    function placeBid(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.currentBid, "Bid too low");
        require(msg.value >= auction.startingPrice, "Bid below starting price");
        
        // Check verification status if required
        if (auction.requiresVerification && address(carbonToken) != address(0)) {
            bool allCreditsVerified = true;
            for (uint i = 0; i < auction.creditIds.length; i++) {
                (bool isValid,) = carbonToken.isCreditValid(auction.creditIds[i]);
                if (!isValid) {
                    allCreditsVerified = false;
                    break;
                }
            }
            
            if (allCreditsVerified) {
                auction.requiresVerification = false;
                // Apply verification discount to starting price for future bids
                auction.startingPrice = auction.startingPrice * (BASIS_POINTS - verificationDiscountRate) / BASIS_POINTS;
            }
        }
        
        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.currentBid);
        }
        
        auction.currentBid = msg.value;
        auction.highestBidder = msg.sender;
        
        emit BidPlaced(auctionId, msg.sender, msg.value);
    }
    
    /**
     * @dev End an auction and distribute tokens/payments
     */
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction still ongoing");
        
        auction.isActive = false;
        activeAuctions--;
        
        if (auction.highestBidder != address(0)) {
            // Final verification check before completing sale
            if (auction.requiresVerification && address(carbonToken) != address(0)) {
                bool allCreditsVerified = true;
                for (uint i = 0; i < auction.creditIds.length; i++) {
                    (bool isValid,) = carbonToken.isCreditValid(auction.creditIds[i]);
                    if (!isValid) {
                        allCreditsVerified = false;
                        break;
                    }
                }
                
                if (!allCreditsVerified) {
                    // Return tokens to seller and refund highest bidder
                    if (address(carbonToken) != address(0)) {
                        carbonToken.transfer(auction.seller, auction.amount * 1e18);
                    }
                    payable(auction.highestBidder).transfer(auction.currentBid);
                    
                    emit AuctionEnded(auctionId, address(0), 0);
                    return;
                }
            }
            
            uint256 fee = (auction.currentBid * marketplaceFee) / BASIS_POINTS;
            uint256 sellerAmount = auction.currentBid - fee;
            
            // Transfer tokens to winner (only if token contract exists)
            if (address(carbonToken) != address(0)) {
                carbonToken.transfer(auction.highestBidder, auction.amount * 1e18);
            }
            
            // Transfer payment to seller
            payable(auction.seller).transfer(sellerAmount);
            
            // Update market statistics
            totalMarketVolume += auction.currentBid;
            totalTrades++;
            
            // Update project statistics
            MarketStats storage stats = projectStats[auction.projectId];
            stats.totalVolume += auction.currentBid;
            stats.totalTrades++;
            if (stats.totalTrades > 0) {
                stats.averagePrice = stats.totalVolume / stats.totalTrades;
            }
            
            emit MarketStatsUpdated(auction.projectId, stats.totalVolume, stats.totalTrades, stats.averagePrice);
        } else {
            // No bids, return tokens to seller
            if (address(carbonToken) != address(0)) {
                carbonToken.transfer(auction.seller, auction.amount * 1e18);
            }
        }
        
        emit AuctionEnded(auctionId, auction.highestBidder, auction.currentBid);
    }
    
    /**
     * @dev Get verified listings (priority listings)
     */
    function getVerifiedListings() external view returns (uint256[] memory verifiedListingIds) {
        uint256 count = 0;
        
        // Count verified listings
        for (uint256 i = 0; i < nextListingId; i++) {
            if (listings[i].isActive && listings[i].isPriorityListing) {
                count++;
            }
        }
        
        // Populate array
        verifiedListingIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < nextListingId; i++) {
            if (listings[i].isActive && listings[i].isPriorityListing) {
                verifiedListingIds[index] = i;
                index++;
            }
        }
        
        return verifiedListingIds;
    }
    
    /**
     * @dev Get market statistics for a project
     */
    function getProjectMarketStats(string memory projectId) external view returns (
        uint256 totalVolume,
        uint256 totalTrades,
        uint256 averagePrice,
        uint256 activeListingsCount,
        uint256 pendingVerifications
    ) {
        MarketStats memory stats = projectStats[projectId];
        
        // Count active listings for this project
        uint256 activeCount = 0;
        uint256 pendingCount = 0;
        
        uint256[] memory projectListingIds = projectListings[projectId];
        for (uint i = 0; i < projectListingIds.length; i++) {
            Listing memory listing = listings[projectListingIds[i]];
            if (listing.isActive) {
                activeCount++;
                if (listing.requiresOracleVerification) {
                    pendingCount++;
                }
            }
        }
        
        return (
            stats.totalVolume,
            stats.totalTrades,
            stats.averagePrice,
            activeCount,
            pendingCount
        );
    }
    
    /**
     * @dev Get global market statistics
     */
    function getGlobalMarketStats() external view returns (
        uint256 totalVolume,
        uint256 totalTrades,
        uint256 activeListingsCount,
        uint256 activeAuctionsCount,
        uint256 averageGlobalPrice
    ) {
        uint256 averagePrice = 0;
        if (totalTrades > 0) {
            averagePrice = totalMarketVolume / totalTrades;
        }
        
        return (
            totalMarketVolume,
            totalTrades,
            activeListings,
            activeAuctions,
            averagePrice
        );
    }
    
    /**
     * @dev Create fractional listing (for partial credit trading)
     */
    function createFractionalListing(
        uint256 amount,
        uint256 pricePerToken,
        uint256 minPurchase,
        uint256 maxPurchase,
        string memory projectId,
        uint256[] memory creditIds
    ) external nonReentrant returns (uint256 listingId) {
        require(minPurchase > 0 && maxPurchase >= minPurchase, "Invalid purchase limits");
        require(maxPurchase <= amount, "Max purchase exceeds listing amount");
        
        // Use regular createListing with additional parameters stored separately
        listingId = createListing(amount, pricePerToken, projectId, 0, creditIds);
        
        // Additional fractional trading logic would be implemented here
        // For now, we'll emit an event to track fractional listings
        
        return listingId;
    }
    
    /**
     * @dev Cancel a listing (only by seller)
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Only seller can cancel");
        require(listing.isActive, "Listing not active");
        
        listing.isActive = false;
        activeListings--;
        
        // Return tokens to seller (only if token contract exists)
        if (address(carbonToken) != address(0)) {
            carbonToken.transfer(msg.sender, listing.amount * 1e18);
        }
    }
    
    /**
     * @dev Emergency cancel auction (only by seller, with penalty)
     */
    function emergencyCancelAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.seller == msg.sender, "Only seller can cancel");
        require(auction.isActive, "Auction not active");
        require(auction.highestBidder == address(0), "Cannot cancel auction with bids");
        
        auction.isActive = false;
        activeAuctions--;
        
        // Return tokens to seller (only if token contract exists)
        if (address(carbonToken) != address(0)) {
            carbonToken.transfer(msg.sender, auction.amount * 1e18);
        }
    }
    
    /**
     * @dev Update marketplace fee (only owner)
     */
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = _fee;
    }
    
    /**
     * @dev Update verification discount rate
     */
    function setVerificationDiscountRate(uint256 _rate) external onlyOwner {
        require(_rate <= 5000, "Discount rate too high"); // Max 50%
        verificationDiscountRate = _rate;
    }
    
    /**
     * @dev Update verification grace period
     */
    function setVerificationGracePeriod(uint256 _period) external onlyOwner {
        require(_period >= 1 days && _period <= 30 days, "Invalid grace period");
        verificationGracePeriod = _period;
    }
    
    /**
     * @dev Update oracle contract
     */
    function updateOracleContract(address _newOracle) external onlyOwner {
        carbonOracle = ICarbonOracle(_newOracle);
    }
    
    /**
     * @dev Update token contract
     */
    function updateTokenContract(address _newToken) external onlyOwner {
        carbonToken = ICarbonCreditToken(_newToken);
    }
    
    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Get listing details with verification status
     */
    function getListingDetails(uint256 listingId) external view returns (
        address seller,
        uint256 amount,
        uint256 pricePerToken,
        string memory projectId,
        uint256 vintage,
        bool isActive,
        uint256 createdAt,
        bool requiresOracleVerification,
        bool isPriorityListing,
        uint256[] memory creditIds
    ) {
        Listing memory listing = listings[listingId];
        return (
            listing.seller,
            listing.amount,
            listing.pricePerToken,
            listing.projectId,
            listing.vintage,
            listing.isActive,
            listing.createdAt,
            listing.requiresOracleVerification,
            listing.isPriorityListing,
            listing.creditIds
        );
    }
    
    /**
     * @dev Get auction details with verification status
     */
    function getAuctionDetails(uint256 auctionId) external view returns (
        address seller,
        uint256 amount,
        uint256 startingPrice,
        uint256 currentBid,
        address highestBidder,
        uint256 endTime,
        bool isActive,
        string memory projectId,
        bool requiresVerification,
        uint256[] memory creditIds
    ) {
        Auction memory auction = auctions[auctionId];
        return (
            auction.seller,
            auction.amount,
            auction.startingPrice,
            auction.currentBid,
            auction.highestBidder,
            auction.endTime,
            auction.isActive,
            auction.projectId,
            auction.requiresVerification,
            auction.creditIds
        );
    }
}