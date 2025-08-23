// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IFHE.sol";

contract MockFHE is IFHE {
    function encrypt(uint256 value, bytes32 publicKey) external pure override returns (bytes memory) {
        return abi.encode(value, publicKey);
    }
    
    function decrypt(bytes memory encryptedValue, bytes32 privateKey) external pure override returns (uint256) {
        (uint256 value, bytes32 publicKey) = abi.decode(encryptedValue, (uint256, bytes32));
        require(keccak256(abi.encode(privateKey)) == keccak256(abi.encode(publicKey)), "Invalid key");
        return value;
    }
    
    function add(bytes memory a, bytes memory b) external pure override returns (bytes memory) {
        (uint256 valueA, bytes32 keyA) = abi.decode(a, (uint256, bytes32));
        (uint256 valueB, bytes32 keyB) = abi.decode(b, (uint256, bytes32));
        require(keyA == keyB, "Key mismatch");
        return abi.encode(valueA + valueB, keyA);
    }
    
    function sub(bytes memory a, bytes memory b) external pure override returns (bytes memory) {
        (uint256 valueA, bytes32 keyA) = abi.decode(a, (uint256, bytes32));
        (uint256 valueB, bytes32 keyB) = abi.decode(b, (uint256, bytes32));
        require(keyA == keyB, "Key mismatch");
        require(valueA >= valueB, "Underflow");
        return abi.encode(valueA - valueB, keyA);
    }
    
    function mul(bytes memory a, bytes memory b) external pure override returns (bytes memory) {
        (uint256 valueA, bytes32 keyA) = abi.decode(a, (uint256, bytes32));
        (uint256 valueB, bytes32 keyB) = abi.decode(b, (uint256, bytes32));
        require(keyA == keyB, "Key mismatch");
        return abi.encode(valueA * valueB, keyA);
    }
    
    function isEqual(bytes memory a, bytes memory b) external pure override returns (bool) {
        (uint256 valueA, bytes32 keyA) = abi.decode(a, (uint256, bytes32));
        (uint256 valueB, bytes32 keyB) = abi.decode(b, (uint256, bytes32));
        require(keyA == keyB, "Key mismatch");
        return valueA == valueB;
    }
    
    function isGreater(bytes memory a, bytes memory b) external pure override returns (bool) {
        (uint256 valueA, bytes32 keyA) = abi.decode(a, (uint256, bytes32));
        (uint256 valueB, bytes32 keyB) = abi.decode(b, (uint256, bytes32));
        require(keyA == keyB, "Key mismatch");
        return valueA > valueB;
    }
}