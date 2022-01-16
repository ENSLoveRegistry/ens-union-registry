const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("United", () => {
  let united, pedro, juana;
  beforeEach(async () => {
    [pedro, juana] = await ethers.getSigners();
    const United = await ethers.getContractFactory("United");
    united = await United.deploy();
    await united.deployed();
  });
  describe("Deployment", () => {
    it("It has an owner", async () => {
      const owner = await united.owner();
      expect(owner).to.not.equal(undefined);
    });
    it("It has the correct Owner", async () => {
      const owner = await united.owner();
      expect(owner).to.equal(pedro.address);
    });
  });
  describe("Proposals", () => {
    it("emits", async () => {
      await expect(united.propose(pedro.address)).to.emit("ProposalSubmitted");
    });

    // it("Should fail if sender doesnt have enough money", async () => {
    //   await expect(
    //     united.connect(juana).propose({
    //       _to: pedro.address,
    //       value: 1,
    //     })
    //   ).to.be.revertedWith("Not enough money sent");
    // });
  });
});
