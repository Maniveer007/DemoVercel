/* eslint-disable prefer-destructuring */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import styles from '../styles';
import { ActionButton, Alert, Card, GameInfo, PlayerInfo } from '../components';
import { useGlobalContext } from '../context';
import { attack, attackSound, defense, defenseSound, player01 as player01Icon, player02 as player02Icon } from '../assets';
import { playAudio } from '../utils/animation.js';
import { ethers } from 'ethers';
import { createInstance ,initFhevm } from 'fhevmjs';

const Battle = () => {
  const { contract, gameData, battleGround, walletAddress, setErrorMessage, showAlert, setShowAlert, player1Ref, player2Ref,instance,publickey } = useGlobalContext();
  const [player2, setPlayer2] = useState({});
  const [player1, setPlayer1] = useState({});
  const { battleName } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    
    const getPlayerInfo = async () => {
      try {
        
        
        const provider=new ethers.providers.Web3Provider(window.ethereum);
    const {chainId}=await provider.getNetwork()
    const publicKey = await provider.call({
      to: "0x0000000000000000000000000000000000000044",
    });
    
    // await window.fhevm.initFhevm();
    initFhevm();
    
    const instance =await createInstance({ chainId, publicKey })
    const contractaddress=contract.address
   
    const token=instance.generateToken({
      name:"Authentication",
      verifyingContract:contractaddress,
    })
    
    console.log(walletAddress);


        let player01Address = null;
        let player02Address = null;

        if (gameData.activeBattle.players[0].toLowerCase() === walletAddress.toLowerCase()) {
          player01Address = gameData.activeBattle.players[0];
          player02Address = gameData.activeBattle.players[1];
        } else {
          player01Address = gameData.activeBattle.players[1];
          player02Address = gameData.activeBattle.players[0];
        }
        const p1TokenData = await contract.getPlayerTokenOut(player01Address,token.publicKey);
        const player01 = await contract.getPlayerOut(player01Address,token.publicKey);
        const player02 = await contract.getPlayerOut(player02Address,token.publicKey);
        
        

        const p1Atten = p1TokenData.attackStrength;
        const p1Defen = p1TokenData.defenseStrength;
        const p1Hen = player01.playerHealth;
        const p1Men = player01.playerMana;
        const p2Hen = player02.playerHealth;
        const p2Men = player02.playerMana;

        const p1Att=instance.decrypt(contract.address,p1Atten)
        const p1Def=instance.decrypt(contract.address,p1Defen)
        const p1H=instance.decrypt(contract.address,p1Hen)
        const p1M=instance.decrypt(contract.address,p1Men)
        const p2H=instance.decrypt(contract.address,p2Hen)
        const p2M=instance.decrypt(contract.address,p2Men)
        console.log(p1Att);

        

        setPlayer1({ ...player01, att: p1Att, def: p1Def, health: p1H, mana: p1M });
        setPlayer2({ ...player02, att: 'X', def: 'X', health: p2H, mana: p2M });
      } catch (error) {
        setErrorMessage(error.message);
        console.log(error);
      }
    };

    if (contract && gameData.activeBattle) getPlayerInfo();
  }, [contract, gameData, battleName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gameData?.activeBattle) navigate('/');
    }, [2000]);

    return () => clearTimeout(timer);
  }, []);

  const makeAMove = async (choice) => {
    playAudio(choice === 1 ? attackSound : defenseSound);

    try {
      await contract.attackOrDefendChoice(choice, battleName, { gasLimit: 5000000 });

      setShowAlert({
        status: true,
        type: 'info',
        message: `Initiating ${choice === 1 ? 'attack' : 'defense'}`,
      });
    } catch (error) {
      setErrorMessage(error);
    }
  };

  return (
    <div className={`${styles.flexBetween} ${styles.gameContainer} ${battleGround}`}>
      {showAlert?.status && <Alert type={showAlert.type} message={showAlert.message} />}

      <PlayerInfo player={player2} playerIcon={player02Icon} mt />

      <div className={`${styles.flexCenter} flex-col my-10`}>
        <Card
          card={player2}
          title={player2?.playerName}
          cardRef={player2Ref}
          playerTwo
        />

        <div className="flex items-center flex-row">
          <ActionButton
            imgUrl={attack}
            handleClick={() => makeAMove(1)}
            restStyles="mr-2 hover:border-yellow-400"
          />

          <Card
            card={player1}
            title={player1?.playerName}
            cardRef={player1Ref}
            restStyles="mt-3"
          />

          <ActionButton
            imgUrl={defense}
            handleClick={() => makeAMove(2)}
            restStyles="ml-6 hover:border-red-600"
          />
        </div>
      </div>

      <PlayerInfo player={player1} playerIcon={player01Icon} />

      <GameInfo />
    </div>
  );
};

export default Battle;
