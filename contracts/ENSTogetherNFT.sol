// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import 'base64-sol/base64.sol';

contract ENSTogetherNFT is
    ERC721,
    AccessControl,
    ERC721Burnable,
    ERC721Enumerable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _tokenIdCounter;

    struct Metadata {
        uint256 id;
        uint8 day;
        uint8 month;
        uint16 year;
        string ens1;
        string ens2;
        address from;
        address to;
    }

    mapping(uint256 => Metadata) public id_to_union;

    constructor(address minter) ERC721("ENSTogether", "ENST") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, minter);
    }

    function mint(
        address from,
        address to,
        string calldata ens1,
        string calldata ens2
    ) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        (uint16 now_year, uint8 now_month, uint8 now_day) = timestampToDate(
            block.timestamp
        );
        id_to_union[tokenId] = Metadata(
            tokenId,
            now_day,
            now_month,
            now_year,
            ens1,
            ens2,
            from,
            to
        );
        _safeMint(to, tokenId);
        uint256 nextTokenId = tokenId + 1;
        _tokenIdCounter++;
        id_to_union[nextTokenId] = Metadata(
            tokenId,
            now_day,
            now_month,
            now_year,
            ens1,
            ens2,
            from,
            to
        );
        _safeMint(from, nextTokenId);
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

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "token not minted");
        Metadata memory nftMinted = id_to_union[tokenId];

        string[9] memory parts;
        parts[
            0
        ] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.small{font-size: 10px}.base {text-anchor: middle; dominant-baseline: central; fill: white; font-family: sans-serif; font-size: 30px}</style><rect width="100%" height="100%" fill="#F43E5E" /><text x="50%" y="50%" class="base"><tspan x="20" y="20" class="small">';

        parts[1] = string(abi.encodePacked("#", toString(tokenId)));

        parts[2] = '</tspan><tspan x="175" y="175" dy="-1.2em">';

        parts[3] = string(
            abi.encodePacked(
                toString(nftMinted.month),
                "-",
                toString(nftMinted.day),
                "-",
                toString(nftMinted.year)
            )
        );

        parts[4] = '</tspan><tspan x="175" y="175">';

        parts[5] = nftMinted.ens1;

        parts[6] = '</tspan><tspan x="175" y="175" dy="1.2em">';

        parts[7] = nftMinted.ens2;

        parts[8] = "</tspan></text></svg>";

        string memory output = string(
            abi.encodePacked(
                parts[0],
                parts[1],
                parts[2],
                parts[3],
                parts[4],
                parts[5],
                parts[6],
                parts[7],
                parts[8]
            )
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Union #',
                        toString(tokenId),
                        '", "description": "Union NFT serves as a proof of your union on the ethereum blockchain", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(output)),
                        '"}'
                    )
                )
            )
        );
        output = string(
            abi.encodePacked("data:application/json;base64,", json)
        );

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

    function timestampToDate(uint256 timestamp)
        public
        pure
        returns (
            uint16 year,
            uint8 month,
            uint8 day
        )
    {
        uint256 z = timestamp / 86400 + 719468;
        uint256 era = (z >= 0 ? z : z - 146096) / 146097;
        uint256 doe = z - era * 146097;
        uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        uint256 mp = (5 * doy + 2) / 153;

        day = uint8(doy - (153 * mp + 2) / 5 + 1);
        month = mp < 10 ? uint8(mp + 3) : uint8(mp - 9);
        year = uint16(yoe + era * 400 + (month <= 2 ? 1 : 0));
    }

    function burn(uint256 tokenId, address _add)
        external
        onlyRole(MINTER_ROLE)
    {
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

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}