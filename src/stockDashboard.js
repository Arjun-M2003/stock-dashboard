import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';

const StockDashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('symbol');
  const [sortDirection, setSortDirection] = useState('asc');

  // Popular stocks to display
  const stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];

  const API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;

  // Company names mapping
  const companyNames = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corporation',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.'
  };

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    
    if (!API_KEY) {
      setError('API key not found. Please check your .env.local file.');
      setLoading(false);
      return;
    }

    try {
      const stockPromises = stockSymbols.map(async (symbol) => {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}&outputsize=compact`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for API errors
        if (data['Error Message']) {
          throw new Error(data['Error Message']);
        }
        
        if (data['Note']) {
          throw new Error('API call frequency limit reached. Please try again in a minute.');
        }

        const timeSeries = data['Time Series (5min)'];
        if (!timeSeries) {
          throw new Error('No time series data available');
        }

        // Get the most recent data point
        const timestamps = Object.keys(timeSeries);
        const latestTimestamp = timestamps[0];
        const latestData = timeSeries[latestTimestamp];

        // Get previous data point for change calculation
        const previousTimestamp = timestamps[1];
        const previousData = timeSeries[previousTimestamp];

        const currentPrice = parseFloat(latestData['4. close']);
        const previousPrice = previousData ? parseFloat(previousData['4. close']) : currentPrice;
        const change = currentPrice - previousPrice;
        const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

        return {
          symbol,
          name: companyNames[symbol] || symbol,
          price: currentPrice.toFixed(2),
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2),
          volume: parseInt(latestData['5. volume']).toLocaleString(),
          high: parseFloat(latestData['2. high']).toFixed(2),
          low: parseFloat(latestData['3. low']).toFixed(2),
          lastUpdated: latestTimestamp
        };
      });

      const stockData = await Promise.all(stockPromises);
      setStocks(stockData);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(err.message || 'Failed to fetch stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const handleSort = (field) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedAndFilteredStocks = stocks
    .filter(stock => 
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  
};

export default StockDashboard;