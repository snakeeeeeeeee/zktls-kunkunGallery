// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@primuslabs/zktls-contracts/src/IPrimusZKTLS.sol";
import "./JsonParser.sol";

contract NFTClaim is ERC721, Ownable {
    using JsonParser for string;

    mapping(address => bool) public hasClaimed;
    mapping(string => bool) public usedScreenNames;
    mapping(uint256 => uint256) public nftIdClaimedCount;
    mapping(uint256 => uint256) public tokenIdToNftId;

    uint256 public constant TOTAL_SUPPLY = 1000;
    uint256 public constant MAX_NFT_ID = 8;
    uint256 public totalClaimed;
    address public primusAddress;
    string private _baseURIString;

    event NFTClaimed(address indexed user, uint256 nftId, uint256 tokenId, string screenName);
    event PrimusAddressUpdated(address indexed newAddress);
    event BaseURIUpdated(string newBaseURI);

    constructor(
        string memory name,
        string memory symbol,
        address _primusAddress,
        string memory baseURI_
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(_primusAddress != address(0), "Invalid Primus address");
        primusAddress = _primusAddress;
        _baseURIString = baseURI_;
    }

    function setPrimusAddress(address _primusAddress) external onlyOwner {
        require(_primusAddress != address(0), "Invalid Primus address");
        primusAddress = _primusAddress;
        emit PrimusAddressUpdated(_primusAddress);
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseURIString = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseURIString;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        uint256 nftId = tokenIdToNftId[tokenId];
        string memory baseURI = _baseURI();
        
        return bytes(baseURI).length > 0
            ? string(abi.encodePacked(baseURI, uint2str(nftId), ".json"))
            : "";
    }

    function claimNFT(Attestation calldata attestation, uint256 nftId) external {
        require(totalClaimed < TOTAL_SUPPLY, "All NFTs have been claimed");
        require(nftId <= MAX_NFT_ID, "Invalid NFT ID");
        require(!hasClaimed[msg.sender], "Already claimed");

        IPrimusZKTLS(primusAddress).verifyAttestation(attestation);

        require(attestation.recipient == msg.sender, "Invalid recipient");

        string memory screenName = attestation.data.extractValue("screen_name");
        require(bytes(screenName).length > 0, "Screen name not found");
        require(!usedScreenNames[screenName], "Screen name already used");

        hasClaimed[msg.sender] = true;
        usedScreenNames[screenName] = true;

        uint256 tokenId = totalClaimed;
        tokenIdToNftId[tokenId] = nftId;
        _safeMint(msg.sender, tokenId);
        nftIdClaimedCount[nftId]++;
        totalClaimed++;

        emit NFTClaimed(msg.sender, nftId, tokenId, screenName);
    }


    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // View functions for frontend
    function getClaimedCount(uint256 nftId) external view returns (uint256) {
        return nftIdClaimedCount[nftId];
    }

    function getRemainingSupply() external view returns (uint256) {
        return TOTAL_SUPPLY - totalClaimed;
    }

    function getUserTokens(address user) external view returns (uint256[] memory tokenIds, uint256[] memory nftIds) {
        uint256 balance = balanceOf(user);
        tokenIds = new uint256[](balance);
        nftIds = new uint256[](balance);
        
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < totalClaimed; i++) {
            if (ownerOf(i) == user) {
                tokenIds[currentIndex] = i;
                nftIds[currentIndex] = tokenIdToNftId[i];
                currentIndex++;
            }
        }
    }
} 