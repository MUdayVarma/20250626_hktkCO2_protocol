// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICarbonCreditToken.sol";

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
    }
    
    ICarbonCreditToken public carbonToken;
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256[]) public userListings;
    
    uint256 public nextListingId;
    uint256 public nextAuctionId;
    uint256 public marketplaceFee = 250; // 2.5%
    uint256 public constant BASIS_POINTS = 10000;
    
    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 price);
    event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 amount);
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 amount);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount);
    
    constructor(address _carbonToken) {
        carbonToken = ICarbonCreditToken(_carbonToken);
    }
    
    function createListing(
        uint256 amount,
        uint256 pricePerToken,
        string memory projectId,
        uint256 vintage
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(pricePerToken > 0, "Price must be greater than 0");
        require(carbonToken.balanceOf(msg.sender) >= amount * 1e18, "Insufficient balance");
        
        uint256 listingId = nextListingId++;
        
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            amount: amount,
            pricePerToken: pricePerToken,
            projectId: projectId,
            vintage: vintage,
            isActive: true,
            createdAt: block.timestamp
        });
        
        userListings[msg.sender].push(listingId);
        
        // Transfer tokens to marketplace
        carbonToken.transferFrom(msg.sender, address(this), amount * 1e18);
        
        emit ListingCreated(listingId, msg.sender, amount, pricePerToken);
    }
    
    function buyListing(uint256 listingId, uint256 amount) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(amount <= listing.amount, "Insufficient amount available");
        require(msg.value >= amount * listing.pricePerToken, "Insufficient payment");
        
        uint256 totalCost = amount * listing.pricePerToken;
        uint256 fee = (totalCost * marketplaceFee) / BASIS_POINTS;
        uint256 sellerAmount = totalCost - fee;
        
        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.isActive = false;
        }
        
        // Transfer tokens to buyer
        carbonToken.transfer(msg.sender, amount * 1e18);
        
        // Transfer payment to seller
        payable(listing.seller).transfer(sellerAmount);
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit ListingSold(listingId, msg.sender, amount);
    }
    
    function createAuction(
        uint256 amount,
        uint256 startingPrice,
        uint256 duration
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(carbonToken.balanceOf(msg.sender) >= amount * 1e18, "Insufficient balance");
        
        uint256 auctionId = nextAuctionId++;
        
        auctions[auctionId] = Auction({
            auctionId: auctionId,
            seller: msg.sender,
            amount: amount,
            startingPrice: startingPrice,
            currentBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            isActive: true
        });
        
        // Transfer tokens to marketplace
        carbonToken.transferFrom(msg.sender, address(this), amount * 1e18);
        
        emit AuctionCreated(auctionId, msg.sender, amount);
    }
    
    function placeBid(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.currentBid, "Bid too low");
        require(msg.value >= auction.startingPrice, "Bid below starting price");
        
        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.currentBid);
        }
        
        auction.currentBid = msg.value;
        auction.highestBidder = msg.sender;
        
        emit BidPlaced(auctionId, msg.sender, msg.value);
    }
    
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction still ongoing");
        
        auction.isActive = false;
        
        if (auction.highestBidder != address(0)) {
            uint256 fee = (auction.currentBid * marketplaceFee) / BASIS_POINTS;
            uint256 sellerAmount = auction.currentBid - fee;
            
            // Transfer tokens to winner
            carbonToken.transfer(auction.highestBidder, auction.amount * 1e18);
            
            // Transfer payment to seller
            payable(auction.seller).transfer(sellerAmount);
        } else {
            // No bids, return tokens to seller
            carbonToken.transfer(auction.seller, auction.amount * 1e18);
        }
        
        emit AuctionEnded(auctionId, auction.highestBidder, auction.currentBid);
    }
    
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = _fee;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Add to CarbonMarketplace.sol
function createFractionalListing(
    uint256 amount,
    uint256 pricePerToken,
    uint256 minPurchase,
    uint256 maxPurchase
) external {
    // Implementation for fractional trading
}

}