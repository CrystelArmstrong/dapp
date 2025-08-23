// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Zama FHE imports for Sepolia
import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

contract ZamaFHE is GatewayCaller {
    constructor(address _gatewayContractAddr) GatewayCaller(_gatewayContractAddr) {}

    function encrypt32(uint32 value) external view returns (euint32) {
        return TFHE.asEuint32(value);
    }
    
    function encryptAddress(address value) external view returns (eaddress) {
        return TFHE.asEaddress(value);
    }
    
    function add(euint32 a, euint32 b) external pure returns (euint32) {
        return TFHE.add(a, b);
    }
    
    function sub(euint32 a, euint32 b) external pure returns (euint32) {
        return TFHE.sub(a, b);
    }
    
    function mul(euint32 a, euint32 b) external pure returns (euint32) {
        return TFHE.mul(a, b);
    }
    
    function eq(euint32 a, euint32 b) external pure returns (ebool) {
        return TFHE.eq(a, b);
    }
    
    function gt(euint32 a, euint32 b) external pure returns (ebool) {
        return TFHE.gt(a, b);
    }
    
    function decrypt(euint32 value) external view returns (uint32) {
        return TFHE.decrypt(value);
    }
    
    function decryptBool(ebool value) external view returns (bool) {
        return TFHE.decrypt(value);
    }
    
    function allow(euint32 value, address account) external {
        TFHE.allow(value, account);
    }
    
    function allowTransient(euint32 value, address account) external {
        TFHE.allowTransient(value, account);
    }
}