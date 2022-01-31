// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "./IENSTogetherNFT.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract ENSTogether is ReentrancyGuard, Ownable {

    address public nftContract; 
    uint public cost = 0.01 ether;
    uint public updateStatusCost = 0.005 ether;
    //it will be longer, 5m is just for testing
    uint public timeToRespond = 5 minutes;
    uint public proposalsCounter = 0;
    uint public registryCounter  = 0;

    //Relationship Status
    enum Proposal {NOTHING, PENDING, ACCEPTED, DECLINED}
    Proposal proposalStatus;
    enum Status {NOTHING, TOGETHER, PAUSED, SEPARATED}
    Status relationshipStatus;

    struct Union {
        address to;
        address from;
        uint8 proposalStatus;
        uint8 relationshipStatus;
        uint proposalNumber;
        uint registryNumber;
        uint createdAt;
        bool expired;
    }  
    
    mapping(address => Union) public unionWith;

    constructor(){}

    //PROPOSAL EVENTS
    event ProposalSubmitted(address indexed to, address indexed from, uint indexed _status );
    event ProposalResponded(address indexed to, address indexed from, uint indexed _status );
    event ProposalCancelled(address indexed to, address indexed from);
    //UNION EVENTS
    event GotUnited(address indexed from, address indexed to, uint  _status,
    uint indexed _timestamp, uint  _registrationNumber);
    event UnionStatusUpdated(address indexed from, address indexed to, uint _status,
    uint indexed _timestamp, uint  _registrationNumber);
    //ERRORS
    error SenderAlreadyPending();
    error ReceiverAlreadyPending();
    //BURNED
    event Burned(uint id, bool);

    function propose(address _to) external payable{
        require(msg.value >= cost, "Insufficient amount");
        require(_to != msg.sender, "Can't registry with yourself as a partner");
        //revert if msg.sender is already united 
        require(unionWith[msg.sender].relationshipStatus == uint8(Status.NOTHING) || unionWith[msg.sender].relationshipStatus == uint8(Status.SEPARATED), "You are already united");
        //avoid proposals to a person already in a relationship
        require(unionWith[_to].relationshipStatus == uint8(Status.NOTHING) || unionWith[_to].expired == true , "This address is already in a relationship");
        // Revert if sender sent a proposal and its not expired or receiver has a pending unexpired proposal 
        if(unionWith[msg.sender].to != address(0) && block.timestamp < unionWith[msg.sender].createdAt + timeToRespond && unionWith[msg.sender].expired == false){
         revert SenderAlreadyPending();
        } else if (unionWith[_to].proposalStatus == uint8(Proposal.PENDING) && block.timestamp < unionWith[_to].createdAt + timeToRespond){
         revert ReceiverAlreadyPending();
        } else  {
        Union memory request;
        request.to = _to;
        request.from = msg.sender;
        request.createdAt = block.timestamp;
        request.proposalNumber = proposalsCounter;
        request.proposalStatus = uint8(Proposal.PENDING);
        unionWith[_to]= request;
        unionWith[msg.sender]= request;
        proposalsCounter++;
        }
        emit ProposalSubmitted(_to, msg.sender,  uint8(Proposal.PENDING));
    }

    function respondToProposal(Proposal response, string calldata ens1, string calldata ens2) external payable{
        //shouldnt be expired
        require(block.timestamp < unionWith[msg.sender].createdAt + timeToRespond, "Proposal expired");
        //Only the address who was invited to be united should respond to the proposal.
        require(unionWith[msg.sender].to == msg.sender, "You cant respond your own proposal, that's scary");
        //Proposal status must be "PENDING"
        require(unionWith[msg.sender].proposalStatus == uint8(Proposal.PENDING), "This proposal has already been responded");
        //instance of the proposal
        Union memory acceptOrDecline = unionWith[msg.sender];
         //get the addresses involved
        address from = acceptOrDecline.from;
        address to = acceptOrDecline.to;
        //if declined cancel and reset proposal
         if(uint8(response) == 3){
            acceptOrDecline.expired = true;
            acceptOrDecline.proposalStatus = uint8(Proposal.DECLINED);
            unionWith[to] = acceptOrDecline;
            unionWith[from] = acceptOrDecline;
            emit ProposalCancelled(to, from);
            return;
        }
        //accept scenario
        if(uint8(response) == 2){
        acceptOrDecline.proposalStatus = uint8(Proposal.ACCEPTED);
        acceptOrDecline.relationshipStatus = uint8(Status.TOGETHER);
        acceptOrDecline.createdAt = block.timestamp;
        unionWith[to] = acceptOrDecline;
        unionWith[from] = acceptOrDecline;
        getUnited(from, to, ens1, ens2 );
        } emit ProposalResponded(to, from, uint8(Proposal.ACCEPTED));
    }
    
    function cancelOrResetProposal() public payable{ 
        Union memory currentProposal = unionWith[msg.sender];
        address to = currentProposal.to;
        address from = currentProposal.from;
        currentProposal.proposalStatus = uint8(Proposal.DECLINED);
        currentProposal.expired = true;
        unionWith[to] = currentProposal;
        unionWith[from] = currentProposal;
        emit ProposalCancelled(to, from);
    }

    
   function getUnited( address _from , address _to, string calldata ens1, string calldata ens2)  internal {
        registryCounter++;
        IENSTogetherNFT(nftContract).mint(_from, _to, ens1, ens2);
        emit GotUnited(_from,  msg.sender, uint8(relationshipStatus), block.timestamp, registryCounter - 1 );
   }

    function updateUnion(Status newStatus) external payable {
        require(msg.value >= updateStatusCost, "Insufficient amount");
        //only people in that union can modify the status
        require(unionWith[msg.sender].to == msg.sender ||
         unionWith[msg.sender].from == msg.sender, "You're address doesn't exist on the union registry" );
         //once separated cannot modify status
         require(unionWith[msg.sender].relationshipStatus != uint8(Status.SEPARATED), "You are separated, make another proposal");
        Union memory unionUpdated = unionWith[msg.sender];
        address from = unionUpdated.from;
        address to = unionUpdated.to;
        unionUpdated.relationshipStatus = uint8(newStatus);
        unionUpdated.createdAt = block.timestamp;
        if(uint8(newStatus) == 3){
            //function to clear proposals made and free users for make new ones.
            unionUpdated.expired = true;
            cancelOrResetProposal();
        }
        unionWith[to] = unionUpdated;
        unionWith[from] = unionUpdated;

        emit UnionStatusUpdated(from, to, uint(newStatus), block.timestamp, unionUpdated.registryNumber);
    }


    function getTokenUri(uint256 _tokenId) external view returns(string memory){
       (string memory uri) = IENSTogetherNFT(nftContract).tokenURI(_tokenId);
       return uri;
    }

    function getTokenIDS(address _add) external view returns (uint[] memory){
        (uint[] memory ids)=  IENSTogetherNFT(nftContract).ownedNFTS(_add);
        return ids;
    }
   
    function burn(uint256 tokenId) external {
         IENSTogetherNFT(nftContract).burn(tokenId, msg.sender);
         emit Burned(tokenId, true);
    }

    //Only owner
    function setNftContractAddress(address _ca) public onlyOwner{
        nftContract = _ca;
    }

    function modifyTimeToRespond (uint t) external onlyOwner{
        timeToRespond = t;
    } 
    function modifyProposalCost(uint amount) external onlyOwner{
        cost = amount;
    }
    function modifyStatusUpdateCost(uint amount) external onlyOwner{
        updateStatusCost = amount;
    }

    function withdraw() external  onlyOwner nonReentrant{
        uint amount = address(this).balance;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed to send Ether");
    }
}

