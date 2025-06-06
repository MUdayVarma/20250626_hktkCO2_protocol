// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonCreditToken is ERC20, Ownable {
    struct CreditInfo {
        string projectId;
        string vintage;
        string verifier;
    }

    mapping(uint256 => CreditInfo) public creditMetadata;

    uint256 public nextBatchId;
    address initialOwner;

    constructor() ERC20("CarbonCreditToken", "CCT") Ownable(msg.sender) {}

    function mintCredits(
        address to,
        uint256 amount,
        string memory projectId,
        string memory vintage,
        string memory verifier
    ) external onlyOwner {
        _mint(to, amount);
        creditMetadata[nextBatchId++] = CreditInfo(
            projectId,
            vintage,
            verifier
        );
    }

    function retireCredits(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
