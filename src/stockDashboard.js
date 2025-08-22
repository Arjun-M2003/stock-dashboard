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
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        📊 Stock Dashboard
      </h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search stocks..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      {/* Error Handling */}
      {error && (
        <div className="text-red-500 font-medium mb-4">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="px-4 py-2">Symbol</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Change</th>
              <th className="px-4 py-2">% Change</th>
              <th className="px-4 py-2">Volume</th>
              <th className="px-4 py-2">High</th>
              <th className="px-4 py-2">Low</th>
              <th className="px-4 py-2">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {stocks.length > 0 ? (
              stocks.map((stock) => (
                <tr
                  key={stock.symbol}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-2 font-semibold">{stock.symbol}</td>
                  <td className="px-4 py-2">{stock.company}</td>
                  <td className="px-4 py-2">${stock.price}</td>
                  <td
                    className={`px-4 py-2 ${
                      stock.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stock.change}
                  </td>
                  <td
                    className={`px-4 py-2 ${
                      stock.changePercent >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stock.changePercent}%
                  </td>
                  <td className="px-4 py-2">{stock.volume}</td>
                  <td className="px-4 py-2">${stock.high}</td>
                  <td className="px-4 py-2">${stock.low}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {stock.lastUpdated}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-6 text-gray-500 italic"
                >
                  No stock data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

};

export default StockDashboard;
