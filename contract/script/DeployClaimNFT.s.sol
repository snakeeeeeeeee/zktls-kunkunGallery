// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {NFTClaim} from "../src/NFTClaim.sol";

contract DeployClaimNFTScript is Script {
    function run() public {
        // Default to Monad Testnet Primus address
        address primusAddress = 0x1Ad7fD53206fDc3979C672C0466A1c48AF47B431;
        
        // NFT基本信息
        string memory name = "KUNKUN Collection";
        string memory symbol = "KUNKUN";
        string memory baseURI = "https://orange-cautious-dove-71.mypinata.cloud/ipfs/bafybeiesqqbceq2r7jpgcysxmclc4w2ohrsw4z7lqicdcgpwwwjg4xf7y4/";
        
        // Use external account (passed via --account parameter)
        vm.startBroadcast();
        
        NFTClaim nftContract = new NFTClaim(
            name,
            symbol,
            primusAddress,
            baseURI
        );
        
        console.log("=== ClaimNFT Deployment Success ===");
        console.log("Contract deployed at:", address(nftContract));
        console.log("NFT Name:", name);
        console.log("NFT Symbol:", symbol);
        console.log("Base URI:", baseURI);
        console.log("Primus address:", primusAddress);
        console.log("Deployed by:", msg.sender);
        console.log("Total Supply:", nftContract.TOTAL_SUPPLY());
        console.log("Max NFT ID:", nftContract.MAX_NFT_ID());
        
        vm.stopBroadcast();
    }
    
    function run(
        address primusAddress,
        string memory baseURI
    ) public {
        // Use custom parameters
        string memory name = "KUNKUN Collection";
        string memory symbol = "KUNKUN";
        
        vm.startBroadcast();
        
        NFTClaim nftContract = new NFTClaim(
            name,
            symbol,
            primusAddress,
            baseURI
        );
        
        console.log("=== ClaimNFT Deployment Success ===");
        console.log("Contract deployed at:", address(nftContract));
        console.log("NFT Name:", name);
        console.log("NFT Symbol:", symbol);
        console.log("Base URI:", baseURI);
        console.log("Primus address:", primusAddress);
        console.log("Deployed by:", msg.sender);
        console.log("Total Supply:", nftContract.TOTAL_SUPPLY());
        console.log("Max NFT ID:", nftContract.MAX_NFT_ID());
        
        vm.stopBroadcast();
    }
    
    function run(
        string memory name,
        string memory symbol,
        address primusAddress,
        string memory baseURI
    ) public {
        // Use all custom parameters
        vm.startBroadcast();
        
        NFTClaim nftContract = new NFTClaim(
            name,
            symbol,
            primusAddress,
            baseURI
        );
        
        console.log("=== ClaimNFT Deployment Success ===");
        console.log("Contract deployed at:", address(nftContract));
        console.log("NFT Name:", name);
        console.log("NFT Symbol:", symbol);
        console.log("Base URI:", baseURI);
        console.log("Primus address:", primusAddress);
        console.log("Deployed by:", msg.sender);
        console.log("Total Supply:", nftContract.TOTAL_SUPPLY());
        console.log("Max NFT ID:", nftContract.MAX_NFT_ID());
        
        vm.stopBroadcast();
    }
} 