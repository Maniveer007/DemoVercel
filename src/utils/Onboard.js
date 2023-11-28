import { ethers } from "ethers";

/* eslint-disable prefer-destructuring */
function isEthereum() {
  if (window.ethereum) {
    return true;
  }
  return false;
}

async function getChainID() {
  const provider=new ethers.providers.Web3Provider(window.ethereum)
  const { chainId } = await provider.getNetwork();
  return chainId;
}

async function handleConnection(accounts) {
  if (accounts.length === 0) {
    const fetchedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return fetchedAccounts;
  }

  return accounts;
}

async function requestAccount() {
  let currentAccount = 0x0;
  if (isEthereum() ) {
    let accounts = await window.ethereum.request({ method: 'eth_accounts' });
    accounts = await handleConnection(accounts);
    currentAccount = accounts[0];
  }
  return currentAccount;
}

async function requestBalance(currentAccount) {
  let currentBalance = 0;
  if (isEthereum()) {
    try {
      currentBalance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [currentAccount, 'latest'],
      });

      currentBalance = parseInt(currentBalance, 16) / 1e18;

      return { currentBalance, err: false };
    } catch (err) {
      return { currentBalance, err: true };
    }
  }
  return { currentBalance, err: true };
}

export const GetParams = async () => {
  const response = {
    isError: false,
    message: '',
    step: -1,
    balance: 0,
    account: '0x0',
  };

  if (!isEthereum()) {
    response.step = 0;
    return response;
  }

  const currentAccount = await requestAccount();
  if (currentAccount === 0x0) {
    response.step = 1;
    return response;
  }

  response.account = currentAccount;

  // if (getChainID() != '0x1f49') {
  //   response.step = 2;
  //   return response;
  // }
  const chainId=await getChainID();
  if (chainId != '0x1f49') {
    response.step = 2;
    return response;
  }
  

  const { currentBalance, err } = await requestBalance(currentAccount);
  if (err) {
    response.isError = true;
    response.message = 'Error fetching balance!';
    return response;
  }
  response.balance = currentBalance;

  if (currentBalance < 1) {
    response.step = 3;
    return response;
  }

  return response;
};

export async function SwitchNetwork() {
  await window?.ethereum?.request({
    method: 'wallet_switchEthereumChain',
    params: [{
      chainId: '0x1F49',

    }],
  }).catch((error) => {
    console.log(error);
  });
}
