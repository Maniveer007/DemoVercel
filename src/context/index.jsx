import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { useNavigate } from 'react-router-dom';

import { GetParams } from '../utils/Onboard.js';
import { ABI, ADDRESS } from '../contract';
import { createEventListeners } from './createEventListeners';

const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [battleGround, setBattleGround] = useState('bg-astral');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [publickey, setpublickey] = useState(null);
  const [instance, setinstance] = useState(null);
  const [step, setStep] = useState(1);
  const [gameData, setGameData] = useState({ players: [], pendingBattles: [], activeBattle: null });
  const [showAlert, setShowAlert] = useState({ status: false, type: 'info', message: '' });
  const [battleName, setBattleName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [updateGameData, setUpdateGameData] = useState(0);

  const player1Ref = useRef();
  const player2Ref = useRef();

  const navigate = useNavigate();

  //* Set battleground to local storage
  useEffect(() => {
    const isBattleground = localStorage.getItem('battleground');

    if (isBattleground) {
      setBattleGround(isBattleground);
    } else {
      localStorage.setItem('battleground', battleGround);
    }
  }, []);

  //* Reset web3 onboarding modal params
  useEffect(() => {
    const resetParams = async () => {
      const currentStep = await GetParams();

      setStep(currentStep.step);
    };

    resetParams();

    window?.ethereum?.on('chainChanged', () => resetParams());
    window?.ethereum?.on('accountsChanged', () => resetParams());
  }, []);

  //* Set the wallet address to the state
  const updateCurrentWalletAddress = async () => {
    const accounts = await window?.ethereum?.request({ method: 'eth_requestAccounts' });

    if (accounts) setWalletAddress(accounts[0]);
  };

  useEffect(() => {
    updateCurrentWalletAddress();

    window?.ethereum?.on('accountsChanged', updateCurrentWalletAddress);
  }, []);

  //* Set the smart contract and provider to the state
  const setSmartContractAndProvider = async () => {
    // const web3Modal = new Web3Modal();
    // const connection = await web3Modal.connect();
    const newProvider = new ethers.providers.Web3Provider(window.ethereum);
    console.log(newProvider);
    const signer = await newProvider.getSigner();
    // console.log(typeof ABI);
    // console.log(ABI);
    // console.log(signer);
    
    const contractfornow= new ethers.Contract(ADDRESS,ABI,signer);
    // const newContract = await ethers.Contract(ADDRESS, ABI, signer);
    console.log(contractfornow);

    setProvider(newProvider);
    setContract(contractfornow);
    // contract=newContract;
  };
  useEffect(() => {

    setSmartContractAndProvider();
  }, []);

  //* Activate event listeners for the smart contract
  useEffect(() => {
    if (step === -1 && contract) {
      createEventListeners({
        navigate,
        contract,
        provider,
        walletAddress,
        setShowAlert,
        player1Ref,
        player2Ref,
        setUpdateGameData,
      });
    }
  }, [step]);

  //* Set the game data to the state
  useEffect(() => {
    const fetchGameData = async () => {
      if (contract) {
        const accounts = await window?.ethereum?.request({ method: 'eth_requestAccounts' })
        const account=accounts[0];
        const fetchedBattles = await contract.getAllBattles();
        const pendingBattles = fetchedBattles.filter((battle) => battle.battleStatus === 0);
        let activeBattle = null;

        fetchedBattles.forEach((battle) => {
          if (battle.players.find((player) => player.toLowerCase() === account.toLowerCase())) {
            if (battle.winner.startsWith('0x00')) {
              activeBattle = battle;
            }
          }
        });

        setGameData({ pendingBattles: pendingBattles.slice(1), activeBattle });
      }
    };

    fetchGameData();
  }, [contract, updateGameData]);

  //* Handle alerts
  useEffect(() => {
    if (showAlert?.status) {
      const timer = setTimeout(() => {
        setShowAlert({ status: false, type: 'info', message: '' });
      }, [5000]);

      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  //* Handle error messages
  useEffect(() => {
    if (errorMessage) {
      const parsedErrorMessage = errorMessage?.reason?.slice('execution reverted: '.length).slice(0, -1);

      if (parsedErrorMessage) {
        setShowAlert({
          status: true,
          type: 'failure',
          message: parsedErrorMessage,
        });
      }
    }
  }, [errorMessage]);
  
  const loadinstance=async()=>{
    const provider=new ethers.providers.Web3Provider(window.ethereum);
    const {chainId}=await provider.getNetwork()
    const publicKey = await provider.call({
      to: "0x0000000000000000000000000000000000000044",
    });
    setpublickey(publicKey);
    await window.fhevm.initFhevm();
    const instance1 =await window.fhevm.createInstance({ chainId, publicKey })
    console.log(instance1);
    setinstance(instance1);
  }
  useEffect(()=>{
    loadinstance()
  },[])

  return (
    <GlobalContext.Provider
      value={{
        player1Ref,
        player2Ref,
        battleGround,
        setBattleGround,
        contract,
        gameData,
        walletAddress,
        updateCurrentWalletAddress,
        showAlert,
        setShowAlert,
        battleName,
        setBattleName,
        errorMessage,
        setErrorMessage,
        publickey,
        instance
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
