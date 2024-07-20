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
  const stocksPerPage = 5;


  const getCurrentStocks = () => {
    const indexOfLastStock = currentPage * stocksPerPage;
    const indexOfFirstStock = indexOfLastStock - stocksPerPage;
    return Object.values(stocksData).slice(indexOfFirstStock, indexOfLastStock);
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

  const checkPriceAlert = (symbol, price, threshold) => {
    if (symbol === 'AMSC' && price >= threshold) {
      alert(`AMSC has reached or exceeded ${threshold}!`);
    }
  };

  const debug = () => {
    console.log('Total stocks:', Object.values(stocksData).length);
console.log('Current page:', currentPage);
console.log('Stocks on this page:', getCurrentStocks().length);
  };

  useEffect(() => {
    if (stocksData['AMSC']) {
      checkPriceAlert('AMSC', parseFloat(stocksData['AMSC'].price), 30);
    }
  }, [stocksData]);
  useEffect(() => {
    console.log("Setting up Firebase listener");
    const unsubscribe = onSnapshot(collection(db, 'symbols'), (snapshot) => {
      const symbolsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Received symbols from Firebase:", symbolsData);
      setSymbols(symbolsData);
    });
  
    return () => unsubscribe();
  }, []);

  return (
    <div className="App">
      <h1>Stock Tracker</h1>
      <button onClick={handleManualUpdate}>Update Stock Data</button>
      <form onSubmit={(e) => { e.preventDefault(); addStock(inputSymbol); }}>
        <input
          type="text"
          value={inputSymbol}
          onChange={(e) => setInputSymbol(e.target.value)}
          placeholder="Enter stock symbol"
        />
        <button type="submit">Add Stock</button>
      </form>
      {Object.values(stocksData).length > 0 ? (
  <>
    {getCurrentStocks().map(stock => (
      <div key={stock.symbol} className="stock-item">
        <h2>{stock.symbol}</h2>
        <p className="price">Price: ${parseFloat(stock.price).toFixed(2)}</p>
        <p className={`change-percent ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
          Change Percent (24h): {stock.changePercent.toFixed(2)}%
        </p>
        {stock.weekData && stock.weekData.length > 0 && (
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={stock.weekData}>
              <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <button onClick={() => deleteStock(symbols.find(s => s.symbol === stock.symbol).id)}>Delete</button>
      </div>
    ))}
    <div className="pagination">
      <button onClick={prevPage} disabled={currentPage === 1}>←</button>
      <span>{currentPage}</span>
      <button onClick={nextPage} disabled={currentPage === Math.ceil(Object.values(stocksData).length / stocksPerPage)}>→</button>
    </div>
  </>
) : (
  <p>Empty dataset</p>
)}
      <button onClick={debug}>debug</button>
    </div>
  );
}

export default App;