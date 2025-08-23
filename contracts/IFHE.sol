// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IFHE {
    function encrypt(uint256 value, bytes32 publicKey) external pure returns (bytes memory);
    function decrypt(bytes memory encryptedValue, bytes32 privateKey) external pure returns (uint256);
    function add(bytes memory a, bytes memory b) external pure returns (bytes memory);
    function sub(bytes memory a, bytes memory b) external pure returns (bytes memory);
    function mul(bytes memory a, bytes memory b) external pure returns (bytes memory);
    function isEqual(bytes memory a, bytes memory b) external pure returns (bool);
    function isGreater(bytes memory a, bytes memory b) external pure returns (bool);
}