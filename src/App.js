// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { db } from './firebase/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import './App.css';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const API_KEY = 'cqdepd9r01qgb1vu15jgcqdepd9r01qgb1vu15k0';

function App() {
  const [stocksData, setStocksData] = useState({});
  const [symbols, setSymbols] = useState([]);
  const [inputSymbol, setInputSymbol] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortMethod, setSortMethod] = useState('none');
  const [notificationSettings, setNotificationSettings] = useState({});
  const [showNotificationUI, setShowNotificationUI] = useState(false);
  const [currentStock, setCurrentStock] = useState(null);
  const [notificationPrice, setNotificationPrice] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatedStock, setAnimatedStock] = useState(null);
  const stocksPerPage = 5;

  const sortStocks = (stocks, method) => {
    return [...stocks].sort((a, b) => {
      if (method === 'highestChangeAsc') {
        return a.changePercent - b.changePercent;
      } else if (method === 'highestChangeDesc') {
        return b.changePercent - a.changePercent;
      }
      return 0;
    });
  };

  const getCurrentStocks = () => {
    const sortedStocks = sortStocks(Object.values(stocksData), sortMethod);
    const indexOfLastStock = currentPage * stocksPerPage;
    const indexOfFirstStock = indexOfLastStock - stocksPerPage;
    return sortedStocks.slice(indexOfFirstStock, indexOfLastStock);
  };

  const nextPage = () => {
    const maxPage = Math.ceil(Object.values(stocksData).length / stocksPerPage);
    setCurrentPage(prev => prev < maxPage ? prev + 1 : 1);
  };
  
  const prevPage = () => {
    const maxPage = Math.ceil(Object.values(stocksData).length / stocksPerPage);
    setCurrentPage(prev => prev > 1 ? prev - 1 : maxPage);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'symbols'), (snapshot) => {
      const symbolsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSymbols(symbolsData);
    });

    return () => unsubscribe();
  }, []);

  const fetchStockData = async () => {
    const newStocksData = {};
    for (const symbolObj of symbols) {
      try {
        const response = await axios.get(
          `https://finnhub.io/api/v1/quote?symbol=${symbolObj.symbol}&token=${API_KEY}`
        );
        const data = response.data;
        if (data && data.c) {
          newStocksData[symbolObj.symbol] = {
            symbol: symbolObj.symbol,
            price: data.c,
            change: data.d,
            changePercent: data.dp,
            lastUpdated: new Date().toLocaleTimeString(),
          };
        }
      } catch (error) {
        console.error(`Error fetching stock data for ${symbolObj.symbol}:`, error);
      }
    }
    setStocksData(newStocksData);
  };

  useEffect(() => {
    fetchStockData();
    const interval = setInterval(fetchStockData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [symbols]);

  const handleManualUpdate = async () => {
    try {
      await fetchStockData();
      console.log(stocksData);
    } catch (error) {
      console.error('Error updating stock data:', error);
    }
  };

  const addStock = async (symbol) => {
    try {
      await addDoc(collection(db, 'symbols'), { symbol });
      setInputSymbol('');
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const deleteStock = async (id) => {
    try {
      await deleteDoc(doc(db, 'symbols', id));
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  const openNotificationSettings = (stock) => {
    setCurrentStock(stock);
    setNotificationPrice(notificationSettings[stock.symbol]?.toString() || '');
    setShowNotificationUI(true);
  };

  const setNotification = () => {
    if (notificationPrice) {
      setNotificationSettings({
        ...notificationSettings,
        [currentStock.symbol]: parseFloat(notificationPrice)
      });
      setShowNotificationUI(false);
    }
  };

  const checkPriceAlerts = () => {
    Object.entries(notificationSettings).forEach(([symbol, targetPrice]) => {
      const currentPrice = stocksData[symbol]?.price;
      if (currentPrice && currentPrice >= targetPrice) {
        setAnimatedStock({ symbol, price: targetPrice });
        setShowAnimation(true);
        setTimeout(() => {
          setShowAnimation(false);
          setAnimatedStock(null);
          alert(`${symbol} has reached or exceeded your target price of $${targetPrice}!`);
        }, 5000);
        const newSettings = { ...notificationSettings };
        delete newSettings[symbol];
        setNotificationSettings(newSettings);
      }
    });
  };
 
  useEffect(() => {
    checkPriceAlerts();
  }, [stocksData]);

  const debug = () => {
    console.log('Total stocks:', Object.values(stocksData).length);
    console.log('Current page:', currentPage);
    console.log('Stocks on this page:', getCurrentStocks().length);
    setShowAnimation(true);
  };

  const AnimatedCharacter = ({ symbol, price }) => (
    <div className="animated-character">
      <div className="congratulation">Congratulations!</div>
      <div className="character-container">
        <div className="character">
          <div className="head">👤</div>
          <div className="body">
            <div className="arm left-arm">
              <div className="hand left-hand">{symbol}</div>
            </div>
            <div className="torso">👔</div>
            <div className="arm right-arm">
              <div className="hand right-hand">${price.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  return (
    <div className="App">
      <h1>Stock Tracker</h1>
      {showAnimation && animatedStock && (
  <AnimatedCharacter symbol={animatedStock.symbol} price={animatedStock.price} />
      )}  
      <div className='update-container'>
      <button className="update" onClick={handleManualUpdate}>Update Stock Data</button>
        </div>
      <form onSubmit={(e) => { e.preventDefault(); addStock(inputSymbol); }}>
        <input
          type="text"
          value={inputSymbol}
          onChange={(e) => setInputSymbol(e.target.value)}
          placeholder="Enter stock symbol"
        />
        <button className="add" type="submit">Add</button>
      </form>
      <div className="sorting-options">
        <label>Sort by: </label>
        <select value={sortMethod} onChange={(e) => setSortMethod(e.target.value)}>
          <option value="none">None</option>
          <option value="highestChangeAsc">Highest Change (Ascending)</option>
          <option value="highestChangeDesc">Highest Change (Descending)</option>
        </select>
      </div>
      
      {Object.values(stocksData).length > 0 ? (
        <>
          {getCurrentStocks().map(stock => (
            <div key={stock.symbol} className="stock-item">
              <h2>{stock.symbol}</h2>
              <p className="price">Price: ${parseFloat(stock.price).toFixed(2)}</p>
              <p className={`change-percent ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                Change Percent (24h): {stock.changePercent.toFixed(2)}%
              </p>
              <p className="last-updated" style={{fontSize: '0.8em', color: '#888'}}>
                Last updated: {stock.lastUpdated}
              </p>
              {stock.weekData && stock.weekData.length > 0 && (
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={stock.weekData}>
                    <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <button className="delete" onClick={() => deleteStock(symbols.find(s => s.symbol === stock.symbol).id)}>Delete</button>
              {notificationSettings[stock.symbol] ? (
                <div>
                  <p>Alert set at: ${notificationSettings[stock.symbol]}</p>
                  <button onClick={() => openNotificationSettings(stock)}>Edit Alert</button>
                </div>
              ) : (
                <button className="alert" onClick={() => openNotificationSettings(stock)}>Set Price Alert</button>
              )}
            </div>
          ))}
          <div className="pagination">
          <button className="pagination" onClick={prevPage} disabled={currentPage === 1}>←</button>
            <span>{currentPage}</span>
            <button className="pagination" onClick={nextPage} disabled={currentPage === Math.ceil(Object.values(stocksData).length / stocksPerPage)}>→</button>
          </div>
        </>
      ) : (
        <p>Empty dataset</p>
      )}
      {showNotificationUI && (
        <div className="notification-overlay">
          <div className="notification-container">
            <h3>{notificationSettings[currentStock.symbol] ? 'Edit' : 'Set'} Price Alert for {currentStock.symbol}</h3>
            <p>Current Price: ${parseFloat(currentStock.price).toFixed(2)}</p>
            <input 
              type="number" 
              placeholder="Enter target price" 
              value={notificationPrice}
              onChange={(e) => setNotificationPrice(e.target.value)}
              style={{ height: '30px' }}
            />
            <div className="notification-buttons">
              <button onClick={setNotification}>{notificationSettings[currentStock.symbol] ? 'Update' : 'Set'} Alert</button>
              <button onClick={() => setShowNotificationUI(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
     
    </div>
  );
}

export default App;