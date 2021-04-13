// SPDX-License-Identifier: NONE

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract BDPDistributor is Ownable {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  address public token;
  address public signer;

  uint256 public totalClaimed;

  mapping(address => bool) public isClaimed;
  event Claimed(address account, uint256 amount);

  constructor(address _token, address _signer) public {
    token = _token;
    signer = _signer;
  }

  function setSigner(address _signer) public onlyOwner {
    signer = _signer;
  }

  function claim(
    address account,
    uint256 amount,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    require(msg.sender == account, "BDPDistributor: wrong sender");
    require(!isClaimed[account], "BDPDistributor: Already claimed");
    require(verifyProof(account, amount, v, r, s), "BDPDistributor: Invalid signer");  

    totalClaimed = totalClaimed + amount;
    isClaimed[account] = true;
    IERC20(token).safeTransfer(account, amount);

    emit Claimed(account, amount);
  }

  function verifyProof(
    address account,
    uint256 amount,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view returns (bool) {
    bytes32 digest = keccak256(abi.encodePacked(account, amount));
    address signatory = ecrecover(digest, v, r, s);
    return signatory == signer;
  }

  function withdraw(address _token) external onlyOwner {
    if (_token == address(0)) {
      payable(owner()).transfer(address(this).balance);
    } else {
      uint256 balance = IERC20(_token).balanceOf(address(this));
      IERC20(_token).safeTransfer(owner(), balance);
    }
  }
}