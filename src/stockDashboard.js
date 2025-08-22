import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';

const StockDashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('symbol');
  const [sortDirection, setSortDirection] = useState('asc');

  const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
  const API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;

  const companyNames = {
    AAPL: 'Apple Inc.',
    GOOGL: 'Alphabet Inc.',
    MSFT: 'Microsoft Corporation',
    AMZN: 'Amazon.com Inc.',
    TSLA: 'Tesla Inc.',
    META: 'Meta Platforms Inc.',
    NVDA: 'NVIDIA Corporation',
    NFLX: 'Netflix Inc.'
  };

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);

    if (!API_KEY) {
      setError('API key not found.');
      setLoading(false);
      return;
    }

    try {
      const stockPromises = stockSymbols.map(async (symbol) => {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}&outputsize=compact`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(symbol, data);

        const timeSeries = data['Time Series (5min)'];
        const timestamps = Object.keys(timeSeries);
        const latest = timeSeries[timestamps[0]];
        const previous = timeSeries[timestamps[1]] || latest;

        const currentPrice = parseFloat(latest['4. close']);
        const previousPrice = parseFloat(previous['4. close']);
        const change = currentPrice - previousPrice;
        const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

        return {
          symbol,
          name: companyNames[symbol],
          price: currentPrice.toFixed(2),
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2),
          volume: parseInt(latest['5. volume']).toLocaleString(),
          high: parseFloat(latest['2. high']).toFixed(2),
          low: parseFloat(latest['3. low']).toFixed(2),
          lastUpdated: timestamps[0]
        };
      });

      const stockData = await Promise.all(stockPromises);
      setStocks(stockData);
    } catch (err) {
      setError('Failed to fetch stock data.');
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
      if (!isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      return sortDirection === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Stock Dashboard</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={fetchStockData}><RefreshCw /></button>
        </div>
      </header>

      {/* Loading / Error */}
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}

      {/* Stock Table */}
      <table className="stock-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('symbol')}>Symbol</th>
            <th onClick={() => handleSort('name')}>Company</th>
            <th onClick={() => handleSort('price')}>Price</th>
            <th onClick={() => handleSort('change')}>Change</th>
            <th onClick={() => handleSort('changePercent')}>% Change</th>
            <th onClick={() => handleSort('volume')}>Volume</th>
            <th>High</th>
            <th>Low</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {sortedAndFilteredStocks.map((stock) => (
            <tr key={stock.symbol}>
              <td>{stock.symbol}</td>
              <td>{stock.name}</td>
              <td>{stock.price}</td>
              <td className={stock.change >= 0 ? 'up' : 'down'}>{stock.change}</td>
              <td className={stock.changePercent >= 0 ? 'up' : 'down'}>{stock.changePercent}%</td>
              <td>{stock.volume}</td>
              <td>{stock.high}</td>
              <td>{stock.low}</td>
              <td>{stock.lastUpdated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockDashboard;
