// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ENSTogetherNFT is ERC721, AccessControl, ERC721Burnable, ERC721Enumerable {
     bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint private _tokenIdCounter;

    struct Metadata {
        uint id;
        uint8 day;
        uint8 month;
        uint16 year;
        string ens1;
        string ens2;
        address from;
        address to;
    }

      mapping(uint256 => Metadata) public id_to_union;

     constructor(address minter ) ERC721("ENSTogether", "ENST") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, minter);
    }

    function mint(address from, address to,  string calldata ens1,string calldata ens2) external onlyRole(MINTER_ROLE) {
         uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        (uint16 now_year, uint8 now_month, uint8 now_day) = timestampToDate(block.timestamp);
        id_to_union[tokenId] = Metadata(tokenId, now_day, now_month, now_year, ens1, ens2, from, to);
        _safeMint(to,tokenId);
        uint256 nextTokenId = tokenId + 1;
        _tokenIdCounter++;
        id_to_union[nextTokenId] = Metadata(tokenId,now_day, now_month, now_year, ens1, ens2, from, to);
        _safeMint(from,nextTokenId);
    }

    function safeMint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
    }

    function ownedNFTS(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
        tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
  }

    function tokenURI(uint tokenId) override public view returns (string memory) {
        require(_exists(tokenId), "token not minted");
        Metadata memory nftMinted = id_to_union[tokenId];

        string[9] memory parts;
        parts[0] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.small{font-size: 10px}.base {text-anchor: middle; dominant-baseline: central; fill: white; font-family: sans-serif; font-size: 30px}</style><rect width="100%" height="100%" fill="#F43E5E" /><text x="50%" y="50%" class="base"><tspan x="20" y="20" class="small">';

        parts[1] = string(abi.encodePacked("#",toString(tokenId)));

        parts[2] = '</tspan><tspan x="175" y="175" dy="-1.2em">';

        parts[3] =  string(abi.encodePacked(toString(nftMinted.month),"-",toString(nftMinted.day),"-",toString(nftMinted.year)));

        parts[4] = '</tspan><tspan x="175" y="175">';

        parts[5] = nftMinted.ens1;

        parts[6] = '</tspan><tspan x="175" y="175" dy="1.2em">';

        parts[7] = nftMinted.ens2;

        parts[8] = '</tspan></text></svg>';

        string memory output = string(abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8]));
        
        string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "Union #', toString(tokenId), '", "description": "Union NFT serves as a proof of your union on the ethereum blockchain", "image": "data:image/svg+xml;base64,', Base64.encode(bytes(output)), '"}'))));
        output = string(abi.encodePacked('data:application/json;base64,', json));

        return output;
    }


     function toString(uint256 value) internal pure returns (string memory) {
    // Inspired by OraclizeAPI's implementation - MIT license
    // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }


    function timestampToDate(uint timestamp) public pure returns (uint16 year, uint8 month, uint8 day) {
        uint z = timestamp / 86400 + 719468;
        uint era = (z >= 0 ? z : z - 146096) / 146097;
        uint doe = z - era * 146097;
        uint yoe = (doe - doe/1460 + doe/36524 - doe/146096) / 365;
        uint doy = doe - (365*yoe + yoe/4 - yoe/100);
        uint mp = (5*doy + 2)/153;

        day = uint8(doy - (153*mp+2)/5 + 1);
        month = mp < 10 ? uint8(mp + 3) : uint8(mp - 9);
        year = uint16(yoe + era * 400 + (month <= 2 ? 1 : 0));
    }

    function burn(uint256 tokenId, address _add) external onlyRole(MINTER_ROLE)   {
        require(ownerOf(tokenId) == _add, "Not your NFT");
        _burn(tokenId);
    }
    
        function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
            internal
            override(ERC721, ERC721Enumerable)
        {
            super._beforeTokenTransfer(from, to, tokenId);
        }

}

/// [MIT License]
/// @title Base64
/// @notice Provides a function for encoding some bytes in base64
/// @author Brecht Devos <brecht@loopring.org>
library Base64 {
    bytes internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /// @notice Encodes some bytes to the base64 representation
    function encode(bytes memory data) internal pure returns (string memory) {
        uint256 len = data.length;
        if (len == 0) return "";

        // multiply by 4/3 rounded up
        uint256 encodedLen = 4 * ((len + 2) / 3);

        // Add some extra buffer at the end
        bytes memory result = new bytes(encodedLen + 32);

        bytes memory table = TABLE;

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for {
                let i := 0
            } lt(i, len) {

            } {
                i := add(i, 3)
                let input := and(mload(add(data, i)), 0xffffff)

                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                out := shl(224, out)

                mstore(resultPtr, out)

                resultPtr := add(resultPtr, 4)
            }

            switch mod(len, 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }

            mstore(result, encodedLen)
        }

        return string(result);
    }
    }