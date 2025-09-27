// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleERC20 is ERC20 {
    address public owner;
    constructor(string memory name_, string memory symbol_, uint256 initialSupply, address recipient) ERC20(name_, symbol_) {
        _mint(recipient, initialSupply);
        owner = recipient;
    }
}
