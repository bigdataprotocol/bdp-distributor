const { expectRevert, time } = require('@openzeppelin/test-helpers')
const BDPDistributor = artifacts.require('BDPDistributor')
const MockERC20 = artifacts.require('MockERC20')
const Web3 = require('web3')
const secp256k1 = require('secp256k1')
var web3 = new Web3();

function sign(msg, privateKey) {
  privateKey = Buffer.from(privateKey, 'hex')
  msg = Buffer.from(msg, 'hex')
  const sig = secp256k1.ecdsaSign(msg, privateKey)
  const ret = {}
  ret.r = sig.signature.slice(0, 32)
  ret.s = sig.signature.slice(32, 64)
  ret.v = sig.recid + 27
  return ret
}

contract('BDPDistributor', ([alice, bob, carol, tom, receiveInit]) => {
  beforeEach(async () => {
    this.token = await MockERC20.new('BDP', 'BDP', 200000, { from: alice })
    this.DISTRIBUTOR = await BDPDistributor.new(this.token.address, '0x40e7c5aA34846968d37e2C6a2EAeec0072967872', { from: alice })
  })

  it('should have correct setting', async () => {
    assert.equal(await this.DISTRIBUTOR.totalClaimed(), '0');
    assert.equal(await this.DISTRIBUTOR.signer(), '0x40e7c5aA34846968d37e2C6a2EAeec0072967872');
    assert.equal(await this.DISTRIBUTOR.token(), this.token.address);
  })

  it('should fail when claim wrong data', async () => {
    await expectRevert(
      this.DISTRIBUTOR.claim(bob, 100,
        '0x25',
        '0x4f4c17305743700648bc4f6cd3038ec6f6af0df73e31757007b7f59df7bee88d',
        '0x7e1941b264348e80c78c4027afc65a87b0a5e43e86742b8ca0823584c6788fd0',
        { from: bob }),
      "BDPDistributor: Invalid signer"
    )
    assert.equal(await this.DISTRIBUTOR.verifyProof(bob, 100,
      '0x25',
      '0x4f4c17305743700648bc4f6cd3038ec6f6af0df73e31757007b7f59df7bee88d',
      '0x7e1941b264348e80c78c4027afc65a87b0a5e43e86742b8ca0823584c6788fd0'
    ), false);
  })

  it('can withdraw', async () => {
    await this.token.transfer(this.DISTRIBUTOR.address, 100000, { from: alice })
    assert.equal(await this.token.balanceOf(this.DISTRIBUTOR.address), 100000);
    await expectRevert(
      this.DISTRIBUTOR.withdraw(this.token.address, { from: bob }),
      "Ownable: caller is not the owner"
    )

    await this.DISTRIBUTOR.withdraw(this.token.address, { from: alice })
    assert.equal(await this.token.balanceOf(this.DISTRIBUTOR.address), 0);
    assert.equal(await this.token.balanceOf(alice), 200000);
  })

  it('correct verify proof', async () => {
    await this.token.transfer(this.DISTRIBUTOR.address, 100000, { from: alice })
    assert.equal(await this.token.balanceOf(this.DISTRIBUTOR.address), 100000);

    var msg = web3.utils.soliditySha3(tom, 5000)
    var s1 = sign(msg.slice(2), '')

    await expectRevert(
      this.DISTRIBUTOR.claim(tom, 5000,
        s1.v,
        s1.r,
        s1.s,
        { from: carol }),
      "BDPDistributor: wrong sender"
    )

    await expectRevert(
      this.DISTRIBUTOR.claim(tom, 5001,
        s1.v,
        s1.r,
        s1.s,
        { from: tom }),
      "BDPDistributor: Invalid signer"
    )

    await this.DISTRIBUTOR.claim(tom, 5000,
      s1.v,
      s1.r,
      s1.s,
      { from: tom })

    assert.equal(await this.token.balanceOf(tom), 5000);

    await expectRevert(
      this.DISTRIBUTOR.claim(tom, 5001,
        s1.v,
        s1.r,
        s1.s,
        { from: tom }),
      "BDPDistributor: Already claimed"
    )

    await expectRevert(
      this.DISTRIBUTOR.claim(tom, 5000,
        s1.v,
        s1.r,
        s1.s,
        { from: carol }),
      "BDPDistributor: wrong sender"
    )

    msg = web3.utils.soliditySha3(bob, 1000)
    s1 = sign(msg.slice(2), '')

    await this.DISTRIBUTOR.claim(bob, 1000,
      s1.v,
      s1.r,
      s1.s,
      { from: bob })

    assert.equal(await this.token.balanceOf(bob), 1000);

    await expectRevert(
      this.DISTRIBUTOR.claim(tom, 5001,
        s1.v,
        s1.r,
        s1.s,
        { from: tom }),
      "BDPDistributor: Already claimed"
    )

    await expectRevert(
      this.DISTRIBUTOR.claim(bob, 1000,
        s1.v,
        s1.r,
        s1.s,
        { from: bob }),
      "BDPDistributor: Already claimed"
    )

    assert.equal(await this.token.balanceOf(this.DISTRIBUTOR.address), 94000);

    await this.DISTRIBUTOR.withdraw(this.token.address, { from: alice })
    assert.equal(await this.token.balanceOf(this.DISTRIBUTOR.address), 0);
    assert.equal(await this.token.balanceOf(alice), 194000);

  })

  it('cannot claim by other signer', async () => {
    await this.token.transfer(this.DISTRIBUTOR.address, 100000, { from: alice })
    assert.equal(await this.token.balanceOf(this.DISTRIBUTOR.address), 100000);

    var msg = web3.utils.soliditySha3(tom, 5000)
    var s1 = sign(msg.slice(2), '')


    await expectRevert(
      this.DISTRIBUTOR.claim(tom, 5000,
        s1.v,
        s1.r,
        s1.s,
        { from: tom }),
      "BDPDistributor: Invalid signer"
    )

    s1 = sign(msg.slice(2), '')

    await this.DISTRIBUTOR.claim(tom, 5000,
      s1.v,
      s1.r,
      s1.s,
      { from: tom })

    assert.equal(await this.token.balanceOf(tom), 5000);

    await expectRevert(
      this.DISTRIBUTOR.claim(tom, 5001,
        s1.v,
        s1.r,
        s1.s,
        { from: tom }),
      "BDPDistributor: Already claimed"
    )
  })

  it('test change signer', async () => {
    await this.token.transfer(this.DISTRIBUTOR.address, 100000, { from: alice })
    assert.equal(await this.token.balanceOf(this.DISTRIBUTOR.address), 100000);

    var msg = web3.utils.soliditySha3(tom, 5000)
    var s1 = sign(msg.slice(2), '')

    assert.equal(await this.DISTRIBUTOR.verifyProof(tom, 5000,
      s1.v,
      s1.r,
      s1.s,
      { from: tom }), true);

      assert.equal(await this.DISTRIBUTOR.verifyProof(bob, 5000,
        s1.v,
        s1.r,
        s1.s,
        { from: bob }), false);

    await this.DISTRIBUTOR.setSigner('0xA5b9e906cd4D76c99b6ad4db1D35e9a8C95d9E0E')
    assert.equal(await this.DISTRIBUTOR.verifyProof(tom, 5000,
      s1.v,
      s1.r,
      s1.s,
      { from: tom }), false);



    await expectRevert(
      this.DISTRIBUTOR.claim(tom, 5000,
        s1.v,
        s1.r,
        s1.s,
        { from: tom }),
      "BDPDistributor: Invalid signer"
    )

    msg = web3.utils.soliditySha3(tom, 1000)
    s1 = sign(msg.slice(2), '')
    assert.equal(await this.DISTRIBUTOR.verifyProof(tom, 1000,
      s1.v,
      s1.r,
      s1.s,
      { from: tom }), true);

    await expectRevert(
      this.DISTRIBUTOR.claim(tom, 1001,
        s1.v,
        s1.r,
        s1.s,
        { from: tom }),
      "BDPDistributor: Invalid signer"
    )

    await this.DISTRIBUTOR.claim(tom, 1000,
      s1.v,
      s1.r,
      s1.s,
      { from: tom })

    assert.equal(await this.token.balanceOf(tom), 1000);

    await expectRevert(
      this.DISTRIBUTOR.claim(tom, 1000,
        s1.v,
        s1.r,
        s1.s,
        { from: tom }),
      "BDPDistributor: Already claimed"
    )

    await expectRevert(
      this.DISTRIBUTOR.claim(bob, 1000,
        s1.v,
        s1.r,
        s1.s,
        { from: bob }),
      "BDPDistributor: Invalid signer"
    )
  })
})
