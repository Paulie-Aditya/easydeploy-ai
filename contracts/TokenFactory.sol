// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SimpleERC20.sol";

contract TokenFactory {
    event TokenDeployed(address indexed owner, address tokenAddress, string name, string symbol);

    function deployERC20(string memory name, string memory symbol, uint256 supply) external returns (address) {
        SimpleERC20 token = new SimpleERC20(name, symbol, supply, msg.sender);
        emit TokenDeployed(msg.sender, address(token), name, symbol);
        return address(token);
    }
}
