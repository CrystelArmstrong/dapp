// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SimpleCounter - A counter contract for testing MetaMask interactions
 * @dev This contract simulates FHE functionality for demonstration on Sepolia testnet
 * Since Sepolia doesn't support actual FHE operations, we simulate the interface
 */
contract SimpleCounter {
    uint256 private count;
    address public owner;
    
    mapping(address => uint256) public userOperations;
    uint256 public totalOperations;
    
    event CounterIncremented(address indexed user, uint256 newCount, uint256 timestamp);
    event CounterDecremented(address indexed user, uint256 newCount, uint256 timestamp);
    event CounterReset(address indexed admin, uint256 timestamp);

    constructor() {
        owner = msg.sender;
        count = 0;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /**
     * @dev Increment the counter (simulating FHE encrypted increment)
     * @param encryptedValue - Simulated encrypted value (ignored for demo)
     * @param inputProof - Simulated proof (ignored for demo)
     */
    function increment(bytes32 encryptedValue, bytes calldata inputProof) external {
        // In real FHE, this would process encrypted values
        // For Sepolia demo, we just increment by 1
        count += 1;
        userOperations[msg.sender] += 1;
        totalOperations += 1;
        
        emit CounterIncremented(msg.sender, count, block.timestamp);
    }

    /**
     * @dev Decrement the counter (simulating FHE encrypted decrement)
     * @param encryptedValue - Simulated encrypted value (ignored for demo)
     * @param inputProof - Simulated proof (ignored for demo)
     */
    function decrement(bytes32 encryptedValue, bytes calldata inputProof) external {
        // In real FHE, this would process encrypted values
        // For Sepolia demo, we just decrement by 1
        require(count > 0, "Counter cannot go below zero");
        count -= 1;
        userOperations[msg.sender] += 1;
        totalOperations += 1;
        
        emit CounterDecremented(msg.sender, count, block.timestamp);
    }

    /**
     * @dev Get the current count (in real FHE, this would return encrypted handle)
     */
    function getCount() external view returns (uint256) {
        // In real FHE implementation, this would return an encrypted handle
        // For Sepolia demo, we return the actual count for visibility
        return count;
    }

    /**
     * @dev Get counter statistics
     */
    function getStats() external view returns (
        uint256 currentCount,
        uint256 totalOps,
        uint256 userOps
    ) {
        return (count, totalOperations, userOperations[msg.sender]);
    }

    /**
     * @dev Reset counter (owner only)
     */
    function reset() external onlyOwner {
        count = 0;
        emit CounterReset(msg.sender, block.timestamp);
    }

    /**
     * @dev Get the contract info for UI display
     */
    function getContractInfo() external view returns (
        string memory name,
        string memory version,
        address contractOwner,
        uint256 deploymentTime
    ) {
        return (
            "SimpleCounter (FHE Demo)",
            "1.0.0",
            owner,
            block.timestamp
        );
    }
}