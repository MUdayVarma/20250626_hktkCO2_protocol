##20250606_hktkCO2_protocol (L2[Hyperion || zkSync || Sepolia]_Chainlink)


[
Contract Addresses (deployed on Sepolia on 28Jun2025):
     CarbonOracle:       0x8f8FF9421596927Ba53986Be4D82bb202e45Eb5c
     CarbonCreditToken:  0xC496538fbD387Ccf5014C4091908fA0a131f3fd7
     CarbonRegistry:     0x325789e3cCB2e0229BEfb18Ddc3894eF546b8F41
     CarbonMarketplace:  SKIPPED
     RetirementContract: 0x24428d459B9BeA1a5697A3d5AbA1B07a84DC5C67
     CarbonPriceOracle:  0x56190F36a337b58EB716483b86d7B33Fd4e55F11
]

Thi project is to demonstrate how Tokenizing carbon credits is an impactful application of blockchain in climate tech. This project contains smart contract with an intent to deploy on Polkadot chain, to leverage the features of Polkadot AssetHub and PolkaVM effectively and to deploy on Polkadot testnet (i.e. Westend).

This project demonstrates a basic Hardhat use case with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

##Project Name
HBCO2- Transparency and clarity in carbon credit usage​

##Problem Statement
The traditional carbon credit and offset system faces significant challenges, including a lack of transparency, where transactions and retirements are often not publicly visible, making it hard to verify credit usage and prevent double-counting or fraud. Fragmented registries with inconsistent formats, manual and slow verification processes, and limited market access for small buyers further complicate the system. Additionally, opaque retirement claims make it difficult for the public to verify companies' offset assertions, undermining trust in the market.​

The challenges of the traditional carbon credit and offset system impact a wide range of stakeholders. Corporates and buyers struggle with opaque pricing and unverifiable offset claims when trying to meet emission reduction goals, while project developers face slow, costly approval processes and limited access to global markets. Auditors and verifiers waste time reconciling fragmented data across disparate registries, regulators and policymakers lack real-time data for effective enforcement and reporting, and retail or small investors are excluded due to high entry barriers, complex onboarding, and illiquid markets.​

##Solution Overview
A blockchain-based tokenization system for carbon credits offers a transparent, tamper-proof, and globally accessible solution to the inefficiencies of the traditional carbon market. By converting verified carbon credits into digital tokens on-chain, each transaction — from issuance to retirement — becomes auditable in real time, eliminating double counting and fraud. Smart contracts automate credit lifecycle events, reducing the need for manual intermediaries and accelerating verification and trading. ​

This approach is innovative because it democratizes access through fractional ownership and DeFi integration, enabling broader participation and liquidity. Its uniqueness lies in combining environmental integrity with financial innovation, creating a trusted, scalable infrastructure for climate action.

##Project Description
HBCO2 is a blockchain-based platform that tokenizes carbon credits, bringing unprecedented transparency, accessibility, and efficiency to carbon markets. The core functionality revolves around converting verified carbon credits from trusted registries (e.g., Verra, Gold Standard) into digital tokens on the blockchain, ensuring every credit is traceable, auditable, and tamper-proof from issuance to retirement.​

##Key features include:​

Tokenized carbon credits (ERC-20 / Hyperion) representing 1 ton of CO₂ each​
Smart contract-powered registry to track minting, trading, and burning of carbon tokens​
Real-time proof of retirement, enabling verifiable ESG claims​
Decentralized marketplace for credit trading and fractional ownership​
Dashboard for corporates and individuals to track offset activity and impact​
The platform can leverage Ethereum (for DeFi liquidity), Hyperion (for interoperability and scalability), and IPFS or Chainlink oracles for verifiable data integration (e.g., satellite imagery or project audit results). Off-chain registries are bridged on-chain via a proof-based retirement mechanism, ensuring integrity at every step.​

Users — from individuals to corporations — can offset emissions transparently, trade credits, or support verified green projects. Small contributors can access fractionalized tokens, while enterprises gain regulatory-grade audit trails for sustainability reporting.​



## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
