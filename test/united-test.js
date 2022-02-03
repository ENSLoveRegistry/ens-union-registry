const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

describe("ENSTogether", () => {
  let enstogether;
  let pedroAdd = "0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5";
  let juanaAdd = "0xDdC12f7c85a9239519097856B695D1d34FBd61FC";
  let cacho;
  let marta;

  beforeEach(async () => {
    [cacho, marta] = await ethers.getSigners();
    const ENSTogether = await ethers.getContractFactory("ENSTogether");
    enstogether = await ENSTogether.deploy(
      "0x084b1c3c81545d370f3634392de611caabff8148"
    );
    await enstogether.deployed();
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
      expect(proposalCount).to.equal(0);
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
  describe("Proposals", () => {
    it("Reverts if insufficient amount", async () => {
      await expect(
        enstogether.connect(pedroAdd).propose(marta.address)
      ).to.be.revertedWith("Insufficient amount");
    });
    it("Reverts if propose to the same address that owner", async () => {
      await expect(
        enstogether.propose(cacho.address, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("Can't registry with yourself as a partner");
    });
    it("Reverts if sender doesnt have an ENS Name", async () => {
      await expect(
        enstogether.propose(marta.address, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("Sender doesnt have ENS name");
    });
    it("Reverts if addressee doesnt have an ENS Name", async () => {
      await expect(
        enstogether.connect(pedroAdd).propose(marta.address, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith(
        "The address you're proposing to doesnt have ENS name"
      );
    });
    it("Emit ProposalSubmitted when success", async () => {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5"],
      });
      let signer = await ethers.getSigner(
        "0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5"
      );
      await expect(
        enstogether.connect(signer).propose(juanaAdd, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.emit("ProposalSubmitted");
    });
  });
});
