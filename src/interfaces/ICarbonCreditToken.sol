// src/interfaces/ICarbonCreditToken.sol
pragma solidity ^0.8.19;

interface ICarbonCreditToken {
    function mintCredit(
        address to,
        uint256 amount,
        string memory projectId,
        string memory registry,
        uint256 vintage,
        string memory methodology,
        string memory ipfsHash
    ) external;
    
    function retireCredit(
        uint256 creditId,
        uint256 amount,
        string memory reason
    ) external;
    
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}