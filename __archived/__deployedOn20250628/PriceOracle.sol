// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OracleIntegration.sol";

contract CarbonPriceOracle is Ownable {
    // Chainlink price feeds
    AggregatorV3Interface internal ethUsdPriceFeed;
    AggregatorV3Interface internal btcUsdPriceFeed;
    
    // Carbon Oracle integration for real-world carbon data
    CarbonOracle public carbonOracle;
    
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 confidence; // Confidence level (0-100)
        string source;
        bool isValid;
    }
    
    struct MarketData {
        uint256 volume24h;
        uint256 marketCap;
        uint256 priceChange24h; // Basis points (100 = 1%)
        uint256 lastTradePrice;
        uint256 bidPrice;
        uint256 askPrice;
        uint256 spread; // Basis points
    }
    
    // Price storage
    mapping(string => PriceData) public carbonPrices; // project ID => price data
    mapping(string => MarketData) public marketData; // project ID => market data
    mapping(string => uint256[]) public priceHistory; // project ID => historical prices
    mapping(string => uint256) public lastPriceUpdate; // project ID => timestamp
    
    // Global carbon market data
    uint256 public globalCarbonPrice; // Weighted average price
    uint256 public globalVolume24h;
    uint256 public globalMarketCap;
    uint256 public totalActiveProjects;
    
    // Price validation settings
    uint256 public maxPriceDeviation = 2000; // 20% max deviation
    uint256 public priceValidityPeriod = 1 hours;
    uint256 public minConfidenceLevel = 70; // Minimum 70% confidence
    
    // Events
    event PriceUpdated(
        string indexed projectId,
        uint256 price,
        uint256 timestamp,
        uint256 confidence,
        string source
    );
    
    event MarketDataUpdated(
        string indexed projectId,
        uint256 volume24h,
        uint256 marketCap,
        uint256 priceChange24h
    );
    
    event GlobalPriceUpdated(
        uint256 globalPrice,
        uint256 volume,
        uint256 marketCap,
        uint256 timestamp
    );
    
    event PriceValidationFailed(
        string indexed projectId,
        uint256 proposedPrice,
        uint256 currentPrice,
        string reason
    );
    
    constructor(address _carbonOracle) {
        // Mainnet addresses - replace with testnet for testing
        ethUsdPriceFeed = AggregatorV3Interface(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419); // ETH/USD
        btcUsdPriceFeed = AggregatorV3Interface(0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c); // BTC/USD
        
        carbonOracle = CarbonOracle(_carbonOracle);
    }
    
    /**
     * @dev Get latest ETH/USD price from Chainlink
     */
    function getLatestEthPrice() public view returns (int) {
        (,int price,,,) = ethUsdPriceFeed.latestRoundData();
        return price;
    }
    
    /**
     * @dev Get latest BTC/USD price from Chainlink
     */
    function getLatestBtcPrice() public view returns (int) {
        (,int price,,,) = btcUsdPriceFeed.latestRoundData();
        return price;
    }
    
    /**
     * @dev Update carbon credit price for a specific project
     */
    function updateCarbonPrice(
        string memory projectId,
        uint256 price,
        uint256 confidence,
        string memory source
    ) public onlyOwner {
        require(price > 0, "Price must be greater than 0");
        require(confidence >= minConfidenceLevel, "Confidence level too low");
        
        // Validate price against existing data
        if (carbonPrices[projectId].isValid) {
            uint256 currentPrice = carbonPrices[projectId].price;
            uint256 deviation = price > currentPrice ? 
                ((price - currentPrice) * 10000) / currentPrice :
                ((currentPrice - price) * 10000) / currentPrice;
                
            if (deviation > maxPriceDeviation) {
                emit PriceValidationFailed(projectId, price, currentPrice, "Price deviation too high");
                return;
            }
        }
        
        // Check if project is oracle verified
        bool isOracleVerified = false;
        if (carbonOracle.isProjectAuthorized(projectId)) {
            (bool verified,,,, address requester) = carbonOracle.getVerificationStatus(projectId);
            isOracleVerified = verified;
        }
        
        // Apply confidence boost for oracle-verified projects
        if (isOracleVerified && confidence < 95) {
            confidence = confidence + 10; // Boost confidence by 10 points
            if (confidence > 100) confidence = 100;
        }
        
        carbonPrices[projectId] = PriceData({
            price: price,
            timestamp: block.timestamp,
            confidence: confidence,
            source: source,
            isValid: true
        });
        
        // Add to price history
        priceHistory[projectId].push(price);
        lastPriceUpdate[projectId] = block.timestamp;
        
        emit PriceUpdated(projectId, price, block.timestamp, confidence, source);
        
        // Update global price if this is a significant project
        _updateGlobalPrice();
    }
    
    /**
     * @dev Update market data for a project
     */
    function updateMarketData(
        string memory projectId,
        uint256 volume24h,
        uint256 marketCap,
        uint256 lastTradePrice,
        uint256 bidPrice,
        uint256 askPrice
    ) external onlyOwner {
        MarketData storage market = marketData[projectId];
        
        // Calculate price change
        uint256 priceChange24h = 0;
        if (market.lastTradePrice > 0) {
            if (lastTradePrice > market.lastTradePrice) {
                priceChange24h = ((lastTradePrice - market.lastTradePrice) * 10000) / market.lastTradePrice;
            } else {
                priceChange24h = ((market.lastTradePrice - lastTradePrice) * 10000) / market.lastTradePrice;
                priceChange24h = type(uint256).max - priceChange24h + 1; // Negative representation
            }
        }
        
        // Calculate spread
        uint256 spread = 0;
        if (askPrice > bidPrice && bidPrice > 0) {
            spread = ((askPrice - bidPrice) * 10000) / bidPrice;
        }
        
        market.volume24h = volume24h;
        market.marketCap = marketCap;
        market.priceChange24h = priceChange24h;
        market.lastTradePrice = lastTradePrice;
        market.bidPrice = bidPrice;
        market.askPrice = askPrice;
        market.spread = spread;
        
        // Update carbon price based on last trade price if confidence is high
        if (lastTradePrice > 0) {
            updateCarbonPrice(projectId, lastTradePrice, 90, "market_trade");
        }
        
        emit MarketDataUpdated(projectId, volume24h, marketCap, priceChange24h);
        
        // Update global metrics
        _updateGlobalMetrics();
    }
    
    /**
     * @dev Get current carbon price for a project
     */
    function getCarbonPrice(string memory projectId) external view returns (
        uint256 price,
        uint256 timestamp,
        uint256 confidence,
        string memory source,
        bool isValid,
        bool isRecent
    ) {
        PriceData memory priceData = carbonPrices[projectId];
        bool recent = (block.timestamp - priceData.timestamp) <= priceValidityPeriod;
        
        return (
            priceData.price,
            priceData.timestamp,
            priceData.confidence,
            priceData.source,
            priceData.isValid,
            recent
        );
    }
    
    /**
     * @dev Get market data for a project
     */
    function getMarketData(string memory projectId) external view returns (
        uint256 volume24h,
        uint256 marketCap,
        uint256 priceChange24h,
        uint256 lastTradePrice,
        uint256 bidPrice,
        uint256 askPrice,
        uint256 spread
    ) {
        MarketData memory market = marketData[projectId];
        return (
            market.volume24h,
            market.marketCap,
            market.priceChange24h,
            market.lastTradePrice,
            market.bidPrice,
            market.askPrice,
            market.spread
        );
    }
    
    /**
     * @dev Get price history for a project
     */
    function getPriceHistory(string memory projectId) external view returns (uint256[] memory) {
        return priceHistory[projectId];
    }
    
    /**
     * @dev Get global carbon market statistics
     */
    function getGlobalMarketStats() external view returns (
        uint256 avgPrice,
        uint256 totalVolume,
        uint256 totalMarketCap,
        uint256 activeProjects,
        uint256 lastUpdate
    ) {
        return (
            globalCarbonPrice,
            globalVolume24h,
            globalMarketCap,
            totalActiveProjects,
            block.timestamp
        );
    }
    
    /**
     * @dev Calculate weighted average price across all projects
     */
    function _updateGlobalPrice() internal {
        // Simplified calculation - in production, would use more sophisticated weighting
        // This is expensive for large datasets - consider off-chain calculation
        
        uint256 totalValue = 0;
        uint256 totalWeight = 0;
        uint256 activeCount = 0;
        
        // Note: This is a placeholder implementation
        // In practice, you'd iterate through known project IDs or use events for tracking
        
        if (totalWeight > 0) {
            globalCarbonPrice = totalValue / totalWeight;
        }
        
        totalActiveProjects = activeCount;
        
        emit GlobalPriceUpdated(globalCarbonPrice, globalVolume24h, globalMarketCap, block.timestamp);
    }
    
    /**
     * @dev Update global market metrics
     */
    function _updateGlobalMetrics() internal {
        // Aggregate volume and market cap across all projects
        // This is a simplified implementation
        
        uint256 totalVolume = 0;
        uint256 totalMarketCapValue = 0;
        
        // In practice, would iterate through all projects or use cached values
        
        globalVolume24h = totalVolume;
        globalMarketCap = totalMarketCapValue;
    }
    
    /**
     * @dev Get price with oracle verification status
     */
    function getCarbonPriceWithVerification(string memory projectId) external view returns (
        uint256 price,
        uint256 confidence,
        bool isOracleVerified,
        bool isPriceRecent,
        uint256 verificationTimestamp
    ) {
        PriceData memory priceData = carbonPrices[projectId];
        
        bool isOracleVerified = false;
        uint256 verificationTime = 0;
        
        if (carbonOracle.isProjectAuthorized(projectId)) {
            (bool verified,, uint256 lastUpdate,, address requester) = carbonOracle.getVerificationStatus(projectId);
            isOracleVerified = verified;
            verificationTime = lastUpdate;
        }
        
        bool isPriceRecent = (block.timestamp - priceData.timestamp) <= priceValidityPeriod;
        
        return (
            priceData.price,
            priceData.confidence,
            isOracleVerified,
            isPriceRecent,
            verificationTime
        );
    }
    
    /**
     * @dev Batch update prices for multiple projects
     */
    function batchUpdatePrices(
        string[] memory projectIds,
        uint256[] memory prices,
        uint256[] memory confidences,
        string[] memory sources
    ) external onlyOwner {
        require(
            projectIds.length == prices.length &&
            prices.length == confidences.length &&
            confidences.length == sources.length,
            "Array length mismatch"
        );
        
        for (uint i = 0; i < projectIds.length; i++) {
            updateCarbonPrice(projectIds[i], prices[i], confidences[i], sources[i]);
        }
    }
    
    /**
     * @dev Convert price between different currencies using Chainlink feeds
     */
    function convertPrice(uint256 usdPrice, string memory targetCurrency) external view returns (uint256) {
        if (keccak256(bytes(targetCurrency)) == keccak256(bytes("ETH"))) {
            int ethUsdPrice = getLatestEthPrice();
            require(ethUsdPrice > 0, "Invalid ETH price");
            return (usdPrice * 1e18) / uint256(ethUsdPrice);
        } else if (keccak256(bytes(targetCurrency)) == keccak256(bytes("BTC"))) {
            int btcUsdPrice = getLatestBtcPrice();
            require(btcUsdPrice > 0, "Invalid BTC price");
            return (usdPrice * 1e8) / uint256(btcUsdPrice);
        } else {
            return usdPrice; // Default to USD
        }
    }
    
    /**
     * @dev Update price validation settings
     */
    function updateValidationSettings(
        uint256 _maxPriceDeviation,
        uint256 _priceValidityPeriod,
        uint256 _minConfidenceLevel
    ) external onlyOwner {
        require(_maxPriceDeviation <= 5000, "Max deviation too high"); // Max 50%
        require(_priceValidityPeriod >= 300, "Validity period too short"); // Min 5 minutes
        require(_minConfidenceLevel >= 50 && _minConfidenceLevel <= 100, "Invalid confidence range");
        
        maxPriceDeviation = _maxPriceDeviation;
        priceValidityPeriod = _priceValidityPeriod;
        minConfidenceLevel = _minConfidenceLevel;
    }
    
    /**
     * @dev Update oracle contract address
     */
    function updateOracleContract(address _newOracle) external onlyOwner {
        carbonOracle = CarbonOracle(_newOracle);
    }
    
    /**
     * @dev Update Chainlink price feed addresses
     */
    function updatePriceFeeds(
        address _ethUsdFeed,
        address _btcUsdFeed
    ) external onlyOwner {
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdFeed);
        btcUsdPriceFeed = AggregatorV3Interface(_btcUsdFeed);
    }
    
    /**
     * @dev Emergency pause price updates
     */
    function emergencyPause() external onlyOwner {
        // Implementation would add pause functionality
        // For now, just emit an event
    }
}