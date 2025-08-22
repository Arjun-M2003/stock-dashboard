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
  const stockSymbols = [
    'AAPL',
    'GOOGL',
    'MSFT',
    'AMZN',
    'TSLA',
    'META',
    'NVDA',
    'NFLX',
  ];

  const API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;

  // Company names mapping
  const companyNames = {
    AAPL: 'Apple Inc.',
    GOOGL: 'Alphabet Inc.',
    MSFT: 'Microsoft Corporation',
    AMZN: 'Amazon.com Inc.',
    TSLA: 'Tesla Inc.',
    META: 'Meta Platforms Inc.',
    NVDA: 'NVIDIA Corporation',
    NFLX: 'Netflix Inc.',
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
          throw new Error(
            'API call frequency limit reached. Please try again in a minute.'
          );
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
        const previousPrice = previousData
          ? parseFloat(previousData['4. close'])
          : currentPrice;
        const change = currentPrice - previousPrice;
        const changePercent =
          previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

        return {
          symbol,
          name: companyNames[symbol] || symbol,
          price: currentPrice.toFixed(2),
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2),
          volume: parseInt(latestData['5. volume']).toLocaleString(),
          high: parseFloat(latestData['2. high']).toFixed(2),
          low: parseFloat(latestData['3. low']).toFixed(2),
          lastUpdated: latestTimestamp,
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
    const direction =
      field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedAndFilteredStocks = stocks
    .filter(
      (stock) =>
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
      currency: 'USD',
    }).format(num);
  };

  return (
    <div className="dashboard-container">
      {/* Header / Top Bar */}
      <header className="dashboard-header">
        <h1>Stock Dashboard</h1>
        {/* Search bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button>Refresh</button>
        </div>
      </header>

      {/* Error / Loading */}
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">{error}</div>}

      {/* Stock List / Table */}
      <div className="stock-list">
        {sortedAndFilteredStocks.map((stock) => (
          <div key={stock.symbol} className="stock-card">
            {/* Stock Header */}
            <div className="stock-header">
              <span className="stock-symbol">{stock.symbol}</span>
              <span className="stock-name">{stock.name}</span>
            </div>

            {/* Stock Prices */}
            <div className="stock-prices">
              <span className="current-price">{stock.price}</span>
              <span
                className={`change ${stock.change >= 0 ? 'up' : 'down'}`}
              >
                {stock.change} ({stock.changePercent}%)
              </span>
            </div>

            {/* Stock Stats */}
            <div className="stock-stats">
              <span>Volume: {stock.volume}</span>
              <span>High: {stock.high}</span>
              <span>Low: {stock.low}</span>
              <span>Last Updated: {stock.lastUpdated}</span>
            </div>

            {/* Optional: trend icons or charts */}
            <div className="stock-trend">
              {/* TrendingUp / TrendingDown icon placeholder */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockDashboard;