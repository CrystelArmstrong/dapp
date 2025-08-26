// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@fhevm/solidity/contracts/TFHE.sol";
import "@fhevm/solidity/contracts/interfaces/FHEVMConfig.sol";

/**
 * @title FHECounter
 * @dev A fully homomorphic encryption (FHE) based counter contract
 * using Zama's FHEVM library for private computation
 */
contract FHECounter is FHEVMConfig {
    // The encrypted counter value - only the owner can decrypt
    euint32 private encryptedCount;
    
    // Owner of the contract
    address public owner;
    
    // Track total number of operations for analytics
    uint256 public totalOperations;
    
    // User operation counts (public for demonstration)
    mapping(address => uint256) public userOperations;
    
    // Events for tracking operations
    event CounterIncremented(address indexed user, uint256 timestamp);
    event CounterDecremented(address indexed user, uint256 timestamp);
    event CounterDecrypted(address indexed user, uint32 clearValue, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        // Initialize the encrypted counter with value 0
        encryptedCount = TFHE.asEuint32(0);
        totalOperations = 0;
    }
    
    /**
     * @dev Increment the counter by an encrypted value
     * @param inputEuint32 The encrypted input value handle
     * @param inputProof The proof for the encrypted input
     */
    function increment(bytes32 inputEuint32, bytes calldata inputProof) external {
        // Convert the input to euint32 and verify the proof
        euint32 encryptedValue = TFHE.asEuint32(inputEuint32, inputProof);
        
        // Homomorphically add the encrypted value to the counter
        encryptedCount = TFHE.add(encryptedCount, encryptedValue);
        
        // Update public statistics
        userOperations[msg.sender] += 1;
        totalOperations += 1;
        
        emit CounterIncremented(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Decrement the counter by an encrypted value
     * @param inputEuint32 The encrypted input value handle
     * @param inputProof The proof for the encrypted input
     */
    function decrement(bytes32 inputEuint32, bytes calldata inputProof) external {
        // Convert the input to euint32 and verify the proof
        euint32 encryptedValue = TFHE.asEuint32(inputEuint32, inputProof);
        
        // Homomorphically subtract the encrypted value from the counter
        encryptedCount = TFHE.sub(encryptedCount, encryptedValue);
        
        // Update public statistics
        userOperations[msg.sender] += 1;
        totalOperations += 1;
        
        emit CounterDecremented(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get the encrypted counter value handle
     * @return The encrypted counter handle for decryption
     */
    function getCount() external view returns (euint32) {
        return encryptedCount;
    }
    
    /**
     * @dev Decrypt the counter value (only owner can decrypt)
     * @return The decrypted counter value
     */
    function decryptCount() external onlyOwner returns (uint32) {
        uint32 clearValue = TFHE.decrypt(encryptedCount);
        emit CounterDecrypted(msg.sender, clearValue, block.timestamp);
        return clearValue;
    }
    
    /**
     * @dev Reset the counter to zero (only owner)
     */
    function resetCounter() external onlyOwner {
        encryptedCount = TFHE.asEuint32(0);
        totalOperations += 1;
    }
    
    /**
     * @dev Get user operation count
     * @param user The user address
     * @return The number of operations performed by the user
     */
    function getUserOperations(address user) external view returns (uint256) {
        return userOperations[user];
    }
    
    /**
     * @dev Check if a user has performed any operations
     * @param user The user address
     * @return True if user has performed operations, false otherwise
     */
    function hasUserPerformedOperations(address user) external view returns (bool) {
        return userOperations[user] > 0;
    }
}