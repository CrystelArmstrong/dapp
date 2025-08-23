// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

contract PrivacyPadZama is ReentrancyGuard, Ownable, GatewayCaller {
    using SafeMath for uint256;
    
    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 deadline;
        bool isActive;
        bool goalReached;
        mapping(address => euint32) encryptedContributions;
        mapping(address => bool) hasContributed;
        address[] contributors;
    }
    
    struct PublicCampaignInfo {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 deadline;
        bool isActive;
        bool goalReached;
        uint256 contributorCount;
    }
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(address => uint256[]) public userCampaigns;
    mapping(address => uint256[]) public userContributions;
    
    uint256 public campaignCounter;
    uint256 public platformFee = 25; // 2.5%
    address public feeRecipient;
    
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goalAmount,
        uint256 deadline
    );
    
    event ContributionMade(
        uint256 indexed campaignId,
        address indexed contributor
    );
    
    event CampaignFinalized(
        uint256 indexed campaignId,
        bool goalReached,
        uint256 totalRaised
    );
    
    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );
    
    modifier validCampaign(uint256 _campaignId) {
        require(_campaignId > 0 && _campaignId <= campaignCounter, "Invalid campaign ID");
        _;
    }
    
    modifier onlyCampaignCreator(uint256 _campaignId) {
        require(campaigns[_campaignId].creator == msg.sender, "Not campaign creator");
        _;
    }
    
    constructor(address _gatewayContractAddr) GatewayCaller(_gatewayContractAddr) {
        feeRecipient = msg.sender;
    }
    
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goalAmount,
        uint256 _durationInDays
    ) external {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_goalAmount > 0, "Goal amount must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");
        
        campaignCounter++;
        uint256 deadline = block.timestamp.add(_durationInDays.mul(1 days));
        
        Campaign storage newCampaign = campaigns[campaignCounter];
        newCampaign.id = campaignCounter;
        newCampaign.creator = msg.sender;
        newCampaign.title = _title;
        newCampaign.description = _description;
        newCampaign.goalAmount = _goalAmount;
        newCampaign.deadline = deadline;
        newCampaign.isActive = true;
        
        userCampaigns[msg.sender].push(campaignCounter);
        
        emit CampaignCreated(
            campaignCounter,
            msg.sender,
            _title,
            _goalAmount,
            deadline
        );
    }
    
    function contributePrivately(
        uint256 _campaignId,
        einput calldata _encryptedAmount,
        bytes calldata _proof
    ) external payable validCampaign(_campaignId) nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(block.timestamp <= campaign.deadline, "Campaign has ended");
        require(msg.value > 0, "Contribution must be greater than 0");
        
        // Convert encrypted input to euint32
        euint32 encryptedContribution = TFHE.asEuint32(_encryptedAmount, _proof);
        
        if (!campaign.hasContributed[msg.sender]) {
            campaign.contributors.push(msg.sender);
            campaign.hasContributed[msg.sender] = true;
            userContributions[msg.sender].push(_campaignId);
        }
        
        // Store encrypted contribution
        campaign.encryptedContributions[msg.sender] = encryptedContribution;
        campaign.raisedAmount = campaign.raisedAmount.add(msg.value);
        
        // Allow the campaign creator to access the encrypted contribution
        TFHE.allow(encryptedContribution, campaign.creator);
        TFHE.allow(encryptedContribution, msg.sender);
        
        if (campaign.raisedAmount >= campaign.goalAmount) {
            campaign.goalReached = true;
        }
        
        emit ContributionMade(_campaignId, msg.sender);
    }
    
    function getEncryptedContribution(uint256 _campaignId, address _contributor) 
        external 
        view 
        validCampaign(_campaignId) 
        returns (euint32) 
    {
        require(
            msg.sender == _contributor || msg.sender == campaigns[_campaignId].creator,
            "Unauthorized access"
        );
        return campaigns[_campaignId].encryptedContributions[_contributor];
    }
    
    function finalizeCampaign(uint256 _campaignId) 
        external 
        validCampaign(_campaignId) 
        onlyCampaignCreator(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign already finalized");
        require(block.timestamp > campaign.deadline, "Campaign still active");
        
        campaign.isActive = false;
        
        emit CampaignFinalized(_campaignId, campaign.goalReached, campaign.raisedAmount);
    }
    
    function withdrawFunds(uint256 _campaignId) 
        external 
        validCampaign(_campaignId) 
        onlyCampaignCreator(_campaignId) 
        nonReentrant 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(!campaign.isActive, "Campaign still active");
        require(campaign.goalReached, "Campaign goal not reached");
        require(campaign.raisedAmount > 0, "No funds to withdraw");
        
        uint256 totalAmount = campaign.raisedAmount;
        uint256 feeAmount = totalAmount.mul(platformFee).div(1000);
        uint256 creatorAmount = totalAmount.sub(feeAmount);
        
        campaign.raisedAmount = 0;
        
        (bool success1, ) = payable(feeRecipient).call{value: feeAmount}("");
        require(success1, "Fee transfer failed");
        
        (bool success2, ) = payable(msg.sender).call{value: creatorAmount}("");
        require(success2, "Creator transfer failed");
        
        emit FundsWithdrawn(_campaignId, msg.sender, creatorAmount);
    }
    
    function refundContributor(uint256 _campaignId) 
        external 
        validCampaign(_campaignId) 
        nonReentrant 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(!campaign.isActive, "Campaign still active");
        require(!campaign.goalReached, "Campaign goal was reached");
        require(campaign.hasContributed[msg.sender], "No contribution found");
        
        // For refund, we use the actual ETH amount contributed
        // In a real implementation, this would need to track the mapping between encrypted and actual amounts
        uint256 refundAmount = address(this).balance.div(campaign.contributors.length);
        require(refundAmount > 0, "No refund available");
        
        campaign.hasContributed[msg.sender] = false;
        campaign.raisedAmount = campaign.raisedAmount.sub(refundAmount);
        
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
    }
    
    function getCampaignInfo(uint256 _campaignId) 
        external 
        view 
        validCampaign(_campaignId) 
        returns (PublicCampaignInfo memory) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        return PublicCampaignInfo({
            id: campaign.id,
            creator: campaign.creator,
            title: campaign.title,
            description: campaign.description,
            goalAmount: campaign.goalAmount,
            raisedAmount: campaign.raisedAmount,
            deadline: campaign.deadline,
            isActive: campaign.isActive,
            goalReached: campaign.goalReached,
            contributorCount: campaign.contributors.length
        });
    }
    
    function getUserCampaigns(address _user) external view returns (uint256[] memory) {
        return userCampaigns[_user];
    }
    
    function getUserContributions(address _user) external view returns (uint256[] memory) {
        return userContributions[_user];
    }
    
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 100, "Fee cannot exceed 10%");
        platformFee = _newFee;
    }
    
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        feeRecipient = _newRecipient;
    }
    
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    receive() external payable {
        revert("Direct payments not allowed");
    }
}