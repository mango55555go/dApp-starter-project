import React, { useEffect, useState } from "react";
import "./App.css";
/* ethers 変数を使えるようにする*/
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [messageValue, setMessageValue] = useState("")
  const [allWaves, setAllWaves] = useState([]);

  const contractAddress = "0x90BB5bE3091c8AB3b946B23434D41355d64d523a"
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
        message: wave.message,
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
  
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
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

  console.log("currentAccount: ", currentAccount);
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

        const waveTxn = await wavePortalContract.wave(messageValue, { gasLimit:300000 });
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
          <button className="waveButton" onClick={connectWallet}>Connect Wallet</button>
        )}
        {currentAccount && (
          <button className="waveButton" onClick={connectWallet}>Wallet Connected</button>
        )}

        {currentAccount && (
          <textarea name="messageArea"
            placeholder="メッセージはこちら"
            type="text"
            id="message"
            value={messageValue}
            onChange={e => setMessageValue(e.target.value)}
          />
        )}

        {currentAccount && (
          <button className="waveButton" onClick={wave}>Wave at Me</button>
        )}

        {currentAccount && (
          allWaves.slice(0).reverse().map((wave, index) => {
            return (
              <div key={index} style={{ backgroundColor: "#F8F8FF", marginTop: "16px", padding: "8px" }}>
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
  }
export default App