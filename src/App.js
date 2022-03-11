import React, { useEffect, useState } from "react";
import "./App.css";
/* ethers 変数を使えるようにする*/
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [firstAnswer, setFirstAnswer] = useState("");
  const [secondAnswer, setSecondAnswer] = useState("");
  const [showAllWaves, setShowAllWaves] = useState(false);
  const [allWaves, setAllWaves] = useState([]);

  const contractAddress = "0x6c733a14f8DCCcdF0c346d838570aAF6d167bC84"
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    const { ethereum } = window;
  
    try {
      if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      /* コントラクトからgetAllWavesメソッドを呼び出す */
      const waves = await wavePortalContract.getAllWaves();
      /* UIに必要なのは、アドレス、タイムスタンプ、メッセージだけなので、以下のように設定 */
      const wavesCleaned = waves.map(wave => {
        return {
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          firstAnswer: wave.firstAnswer,
          secondAnswer: wave.secondAnswer,
        };
      });
  
      /* React Stateにデータを格納する */
      setAllWaves(wavesCleaned);
      } else {
      console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;
  
    const onNewWave = (from, timestamp, firstAnswer, secondAnswer, winProbability) => {
      console.log("NewWave", from, timestamp, firstAnswer, secondAnswer, winProbability);
      setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        firstAnswer: firstAnswer,
        secondAnswer: secondAnswer,
      },
      ]);
    };
  
    /* NewWaveイベントがコントラクトから発信されたときに、情報をを受け取ります */
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
    /*メモリリークを防ぐために、NewWaveのイベントを解除します*/
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  // window.ethereumにアクセスできることを確認します。
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      // ユーザーのウォレットへのアクセスが許可されているかどうかを確認します。
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllWaves()
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }
  // connectWalletメソッドを実装
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }
  // waveの回数をカウントする関数を実装
  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        console.log("Signer:", signer);

        let contractBalance = await provider.getBalance(wavePortalContract.address);
        console.log("Contract balance:", ethers.utils.formatEther(contractBalance));

        const waveTxn = await wavePortalContract.wave(firstAnswer, secondAnswer, { gasLimit:300000 });
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        let contractBalance_post = await provider.getBalance(wavePortalContract.address);
        console.log("contractBalance_post balance:", ethers.utils.formatEther(contractBalance_post));
        if (contractBalance_post < contractBalance) {
          console.log("User won ETH!");
        } else {
          console.log("User didn't win ETH.");
        }
        console.log("Contract balance after wave:", ethers.utils.formatEther(contractBalance_post));
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }
  // WEBページがロードされたときに下記の関数を実行します。
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="hand-wave">👋</span> WELCOME!
        </div>
        <div className="bio">
          イーサリアムウォレットを接続して、「<span role="img" aria-label="hand-wave">👋</span>(wave)」を送ってください<span role="img" aria-label="shine">✨</span>
        </div>
        {!currentAccount && (
          <button className="connectWalletButton" onClick={connectWallet}>Connect Wallet</button>
        )}

        {currentAccount && (
          <button className="connectWalletButton" onClick={connectWallet}>Wallet Connected</button>
        )}

        {currentAccount && (
          <div>
            <h4>UNCHAIN 独自のコミュニティトークン名は何でしょうか（先頭の$は不要） </h4>
            <textarea name="messageArea"
              placeholder="１問目の回答"
              type="text"
              id="firstAnswer"
              value={firstAnswer}
              onChange={e => setFirstAnswer(e.target.value)}
            />
            <h4>UNCHAIN の運営している会社名は何でしょうか（株式会社は不要かつ英語小文字） </h4>
            <textarea name="messageArea"
              placeholder="２問目の回答"
              type="text"
              id="secondAnswer"
              value={secondAnswer}
              onChange={e => setSecondAnswer(e.target.value)}
            />
          </div>
        )}

        {currentAccount && (
          <button className="waveButton" onClick={wave}>Wave at Me</button>
        )}

        <button className="showWavesButton" onClick={() => setShowAllWaves(!showAllWaves)}>
          {showAllWaves ? "Hide" : "Show" } All Waves(You will see other people's answers)
        </button>

        {currentAccount && showAllWaves && (
          allWaves.slice(0).reverse().map((wave, index) => {
            return (
              <div key={index} style={{ backgroundColor: "#F8F8FF", marginTop: "16px", padding: "8px" }}>
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>First Answer: {wave.firstAnswer}</div>
                <div>Second Answer: {wave.secondAnswer}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
  }
export default App