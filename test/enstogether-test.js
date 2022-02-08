const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const chai = require("chai");
const assertArrays = require("chai-arrays");
chai.use(assertArrays);

describe("ENSTogether", () => {
  let enstogether;
  let pedroAdd = "0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5";
  let juanaAdd = "0x3b3525f60eeea4a1ef554df5425912c2a532875d";
  let thirdAdd = "0x9297a132af2a1481441ab8dc1ce6e243d879eafd";
  let cacho;
  let marta;

  beforeEach(async () => {
    //GET RANDOM SIGNERS FROM MAINNET FORK
    [cacho, marta] = await ethers.getSigners();

    //DEPLOY ENSTOGETHER CONTRACT
    const ENSTogether = await ethers.getContractFactory("ENSTogether");
    enstogether = await ENSTogether.deploy(
      "0x084b1c3c81545d370f3634392de611caabff8148"
    );
    await enstogether.deployed();
    //DEPLOY ENSTOGETHER NFT CONTRACT PASSING THE ENSTOGETHER CONTRACT AS MINTER AND ADMIN ROLE
    const ENSTogetherNFT = await ethers.getContractFactory("ENSTogetherNFT");
    const ensTogetherNFT = await ENSTogetherNFT.deploy(enstogether.address);
    await ensTogetherNFT.deployed();

    // OWNER SETS ENSTOGETHERNFT CONTRACT ADDRESS ON ENSTOGETHER CONTRACT
    await enstogether.setNftContractAddress(ensTogetherNFT.address);

    //IMPERSONATING ACCOUNT
    await ethers.provider.send("hardhat_impersonateAccount", [pedroAdd]);
    pedroSigner = await ethers.getSigner(pedroAdd);

    //START WITH A PROPOSAL MADE TO TEST RESPONSE AND UPDATE FUNCTIONS
    proposal = await enstogether.connect(pedroSigner).propose(juanaAdd, {
      value: ethers.utils.parseEther("0.01"),
    });
    //GET CONTRACT BALANCE
    provider = waffle.provider;
    contractBalance = await provider.getBalance(enstogether.address);
    ownerOfTheContract = await enstogether.connect(pedroSigner).owner();
    cachobalance = await provider.getBalance(cacho.address);
  });

  describe("Deployment", () => {
    it("It has an owner", async () => {
      const owner = await enstogether.owner();
      expect(owner).to.not.equal(undefined);
    });
    it("It has the correct Owner", async () => {
      const owner = await enstogether.owner();
      expect(owner).to.equal(cacho.address);
    });
    it("ProposalCounter is at 0", async () => {
      const proposalCount = await enstogether.proposalsCounter();
      if (proposal) {
        expect(proposalCount).to.equal(1);
      } else expect(proposalCount).to.equal(0);
    });
    it("RegistryCounter is at 0", async () => {
      const registrycount = await enstogether.registryCounter();
      expect(registrycount).to.equal(0);
    });
    it("Cost is 0.005 ETH", async () => {
      const cost = await enstogether.cost();
      expect(cost).to.equal(ethers.utils.parseEther("0.01"));
    });
    it("Time to response is 5m", async () => {
      const ttr = await enstogether.timeToRespond();
      expect(ttr).to.equal(5 * 60);
    });
  });
  describe("Proposal Impersonating ACC", () => {
    it("Reverts if insufficient amount", async () => {
      await expect(
        enstogether.connect(pedroSigner).propose(marta.address)
      ).to.be.revertedWith("Insufficient amount");
    });
    it("Reverts if propose to the same address that owner", async () => {
      await expect(
        enstogether.connect(pedroSigner).propose(pedroSigner.address, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("Can't registry with yourself as a partner");
    });
    it("Reverts if sender doesnt have an ENS Name", async () => {
      await expect(
        enstogether.propose(marta.address, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("Sender doesn't have ENS name");
    });

    it("Reverts if addressee doesnt have an ENS Name", async () => {
      await expect(
        enstogether.connect(pedroSigner).propose(marta.address, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith(
        "The address you're proposing to doesnt have ENS name"
      );
    });
    // Revert when msg.sender already has a pending proposal
    it("emits SenderPendingProposal", async () => {
      await expect(
        enstogether.connect(pedroSigner).propose(juanaAdd, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("SenderPendingProposal");
    });
    // Revert when addressee already has a pending proposal
    it("emits ReceiverPendingProposal", async () => {
      await ethers.provider.send("hardhat_impersonateAccount", [thirdAdd]);
      let signer = await ethers.getSigner(thirdAdd);
      await expect(
        enstogether.connect(signer).propose(juanaAdd, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("ReceiverPendingProposal");
    });
    // Fresh test when no one has a previous pending proposal.
    // it("Emit ProposalSubmitted", async () => {
    //     await expect(
    //       enstogether.connect(signer).propose(juanaAdd, {
    //         value: ethers.utils.parseEther("0.01"),
    //       })
    //     )
    //       .to.emit(enstogether, "ProposalSubmitted")
    //       .withArgs(juanaAdd, signer.address);
    // });

    describe("CancelOrReset Function", () => {
      it("emits ProposalCancelled if sender cancel proposal", async () => {
        await ethers.provider.send("hardhat_impersonateAccount", [juanaAdd]);
        juanaSigner = await ethers.getSigner(juanaAdd);

        await expect(enstogether.connect(pedroSigner).cancelOrResetProposal())
          .to.emit(enstogether, "ProposalCancelled")
          .withArgs(juanaSigner.address, pedroSigner.address);
      });
    });

    describe("Respond To Proposal Function", () => {
      beforeEach(async () => {
        await ethers.provider.send("hardhat_impersonateAccount", [juanaAdd]);
        juanaSigner = await ethers.getSigner(juanaAdd);
      });

      it("fails if input is 0 or 1", async () => {
        await expect(
          enstogether
            .connect(juanaSigner)
            .respondToProposal(1, "coco.eth", "cosmo.eth")
        ).to.be.revertedWith("Response not valid");
      });

      it("Reverts if the sender try to response", async () => {
        await expect(
          enstogether
            .connect(pedroSigner)
            .respondToProposal(2, "klmlkm.eth", "dhbjhme.eth")
        ).to.be.revertedWith(
          "You cant respond your own proposal, that's scary"
        );
      });
      it("reverts if proposal has been already responded", async () => {
        await expect(
          enstogether
            .connect(juanaSigner)
            .respondToProposal(2, "nick.eth", "dame.eth")
        )
          .to.emit(enstogether, "ProposalResponded")
          .withArgs(juanaSigner.address, pedroSigner.address, 2);
        //try to respond again after it was already responded.
        await expect(
          enstogether
            .connect(juanaSigner)
            .respondToProposal(2, "nick.eth", "dame.eth")
        ).to.be.revertedWith("This proposal has already been responded");
      });

      it("Decline proposal and emit ProposalCancelled", async () => {
        await expect(
          enstogether
            .connect(juanaSigner)
            .respondToProposal(3, "nick.eth", "dame.eth")
        )
          .to.emit(enstogether, "ProposalCancelled")
          .withArgs(juanaSigner.address, pedroSigner.address);
      });
      it("emits ProposalResponded increment RegistryCounter, ProposalsCounter", async () => {
        await expect(
          enstogether
            .connect(juanaSigner)
            .respondToProposal(2, "nick.eth", "dame.eth")
        )
          .to.emit(enstogether, "ProposalResponded")
          .withArgs(juanaSigner.address, pedroSigner.address, 2);

        const registrycount = await enstogether.registryCounter();
        expect(registrycount).to.equal(1);
        const proposalCount = await enstogether.proposalsCounter();
        expect(proposalCount).to.equal(1);
      });
    });
    describe("Accept proposal and Got United", () => {
      it("emits GotUnited event", async () => {
        await ethers.provider.send("hardhat_impersonateAccount", [juanaAdd]);
        juanaSigner = await ethers.getSigner(juanaAdd);

        //regisitryCount is 0 before getting united
        const registrycount = await enstogether.registryCounter();

        const receipt = enstogether
          .connect(juanaSigner)
          .respondToProposal(2, "nick.eth", "dame.eth");
        //ts returns an object with the timestamp
        // ts.timestamp +1 because respondToProposal function calls another function that
        // emits the GotUnited event and gets mined on the next block
        //this is for testing purposes only bc on solidity you get the timestamp directly within the event
        const ts = await ethers.provider.getBlock(receipt.blockNumber);
        const unionD = await enstogether.unionWith(juanaSigner.address);
        await expect(receipt)
          .to.emit(enstogether, "GotUnited")
          .withArgs(
            pedroSigner.address,
            juanaSigner.address,
            ts.timestamp + 1,
            unionD.registryNumber
          );
        //registryCount should be 1 after
        const registrycountAfterAccepting = await enstogether.registryCounter();
        expect(registrycountAfterAccepting).to.equal(1);
        //getUnionData
        const unionData = await enstogether.unionWith(juanaSigner.address);
        expect(unionData.to).to.equal(juanaSigner.address);
        expect(unionData.from).to.equal(pedroSigner.address);
        expect(unionData.registryNumber).to.equal(0);
        expect(unionData.proposalNumber).to.equal(0);
        expect(unionData.relationshipStatus).to.equal(1);
        expect(unionData.proposalStatus).to.equal(2);
      });
    });
    describe("Update Function", () => {
      it("Reverts if insufficient amount", async () => {
        await expect(
          enstogether
            .connect(pedroSigner)
            .updateUnion(2, { value: ethers.utils.parseEther("0.0003") })
        ).to.be.revertedWith("Insufficient amount");
      });
      it("Reverts if try to update once status is SEPARATED", async () => {
        //first update to separated
        await enstogether
          .connect(pedroSigner)
          .updateUnion(3, { value: ethers.utils.parseEther("0.005") });
        await expect(
          enstogether
            .connect(pedroSigner)
            .updateUnion(2, { value: ethers.utils.parseEther("0.005") })
        ).to.be.revertedWith("You are separated, make another proposal");
      });
      it("Updates function to PAUSED and emit UnionStatusUpdated", async () => {
        await ethers.provider.send("hardhat_impersonateAccount", [juanaAdd]);
        juanaSigner = await ethers.getSigner(juanaAdd);
        //respond proposal
        await enstogether
          .connect(juanaSigner)
          .respondToProposal(2, "nick.eth", "dame.eth");
        //update to PASUED
        const receipt = await enstogether
          .connect(juanaSigner)
          .updateUnion(2, { value: ethers.utils.parseEther("0.005") });
        // console.log(receipt);
        const ts = await ethers.provider.getBlock(receipt.blockNumber);

        await expect(receipt)
          .to.emit(enstogether, "UnionStatusUpdated")
          .withArgs(pedroSigner.address, juanaSigner.address, 2, ts.timestamp);

        const unionData = await enstogether.unionWith(juanaSigner.address);
        expect(unionData.to).to.equal(juanaSigner.address);
        expect(unionData.from).to.equal(pedroSigner.address);
        expect(unionData.registryNumber).to.equal(0);
        expect(unionData.proposalNumber).to.equal(0);
        expect(unionData.relationshipStatus).to.equal(2);
        expect(unionData.proposalStatus).to.equal(2);
      });
      it("Updates function to SEPARATED and emit UnionStatusUpdated", async () => {
        await ethers.provider.send("hardhat_impersonateAccount", [juanaAdd]);
        juanaSigner = await ethers.getSigner(juanaAdd);
        //respond proposal
        await enstogether
          .connect(juanaSigner)
          .respondToProposal(2, "nick.eth", "dame.eth");
        //update to SEPARATED
        const receipt = await enstogether
          .connect(juanaSigner)
          .updateUnion(3, { value: ethers.utils.parseEther("0.005") });
        const ts = await ethers.provider.getBlock(receipt.blockNumber);

        await expect(receipt)
          .to.emit(enstogether, "UnionStatusUpdated")
          .withArgs(pedroSigner.address, juanaSigner.address, 3, ts.timestamp);

        const unionData = await enstogether.unionWith(juanaSigner.address);
        expect(unionData.to).to.equal(juanaSigner.address);
        expect(unionData.from).to.equal(pedroSigner.address);
        expect(unionData.registryNumber).to.equal(0);
        expect(unionData.proposalNumber).to.equal(0);
        expect(unionData.relationshipStatus).to.equal(3);
        expect(unionData.proposalStatus).to.equal(3);
        expect(unionData.expired).to.equal(true);
      });
    });
    describe("NFT creation when United", () => {
      beforeEach(async () => {
        await ethers.provider.send("hardhat_impersonateAccount", [juanaAdd]);
        juanaSigner = await ethers.getSigner(juanaAdd);
      });
      it("Creates an NFT for each one after the proposal was accepted", async () => {
        //respond proposal
        await enstogether
          .connect(juanaSigner)
          .respondToProposal(2, "nick.eth", "dame.eth");
        const tokenIDsReceiver = await enstogether.getTokenIDS(
          juanaSigner.address
        );
        expect(tokenIDsReceiver).to.be.array();
        expect(tokenIDsReceiver).to.be.ofSize(1);
        expect(tokenIDsReceiver[0]).to.equal(0);
        const tokenIDsSender = await enstogether.getTokenIDS(
          pedroSigner.address
        );
        expect(tokenIDsSender).to.be.array();
        expect(tokenIDsSender).to.be.ofSize(1);
        expect(tokenIDsSender[0]).to.equal(1);

        const tokenUriReceiver = await enstogether.getTokenUri(
          tokenIDsReceiver[0]
        );
        // console.log("tokenUri", tokenUriReceiver);
        const tokenUriSender = await enstogether.getTokenUri(tokenIDsSender[0]);
        // console.log("tokenUri", tokenUriSender);
      });
    });
    describe("OnlyOwner functions", () => {
      it("modifies time to respond", async () => {
        await enstogether.modifyTimeToRespond(10 * 60);
        const changedTTR = await enstogether.timeToRespond();
        expect(changedTTR).to.equal(10 * 60);
      });
      it("modifies proposal cost", async () => {
        await enstogether.modifyProposalCost(ethers.utils.parseEther("0.02"));
        const changedCost = await enstogether.cost();
        expect(changedCost).to.equal(ethers.utils.parseEther("0.02"));
      });
      it("modifies updateStatus cost", async () => {
        await enstogether.modifyStatusUpdateCost(ethers.utils.parseEther("1"));
        const changedUCost = await enstogether.updateStatusCost();
        expect(changedUCost).to.equal(ethers.utils.parseEther("1"));
      });
      it("Withdraws funds", async () => {
        let ownerBF = await provider.getBalance(cacho.address);
        await enstogether.withdraw();
        let contractBalanceAW = await provider.getBalance(enstogether.address);
        let ownerAF = await provider.getBalance(cacho.address);
        expect(contractBalanceAW).to.equal(0);
        expect(ownerAF).to.be.gt(ownerBF);
      });
      it("Fails if not the owner call the above functions", async () => {
        await ethers.provider.send("hardhat_impersonateAccount", [juanaAdd]);
        juanaSigner = await ethers.getSigner(juanaAdd);
        await expect(
          enstogether.connect(juanaSigner.address).modifyTimeToRespond(10 * 60)
        ).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(
          enstogether
            .connect(juanaSigner.address)
            .modifyProposalCost(ethers.utils.parseEther("0.02"))
        ).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(
          enstogether
            .connect(juanaSigner.address)
            .modifyStatusUpdateCost(ethers.utils.parseEther("1"))
        ).to.be.revertedWith("Ownable: caller is not the owner");
        await expect(
          enstogether.connect(juanaSigner.address).withdraw()
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });
});
