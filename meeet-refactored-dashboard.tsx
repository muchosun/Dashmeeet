import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Scatter, ScatterChart, ZAxis } from 'recharts';
import Papa from 'papaparse';

// =============== УТИЛИТЫ ===============
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('ru-RU').format(Math.round(num));
};

const formatPercent = (num) => {
  if (num === undefined || num === null) return '0.0%';
  return num.toFixed(1) + '%';
};

const formatTokenPrice = (price) => {
  if (price === undefined || price === null) return '0.000000';
  return price.toFixed(6);
};

// =============== ХУКИ ===============
// Хук для загрузки и обработки CSV данных
const useDataLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Загрузка CSV файла
        const fileContent = await window.fs.readFile('results.csv', { encoding: 'utf8' });
        
        // Парсинг CSV
        const parsedData = Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        if (parsedData.data && parsedData.data.length > 0) {
          setRawData(parsedData.data);
        } else {
          throw new Error("Данные не загружены или их структура некорректна");
        }
        
      } catch (err) {
        setError(err.message || "Ошибка при загрузке данных");
        console.error("Ошибка при загрузке данных:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  return { isLoading, rawData, error };
};

// =============== КОМПОНЕНТЫ ===============
// Компонент для отображения ключевых метрик
const MetricsPanel = ({ metrics, type }) => {
  const getMetricsData = () => {
    switch (type) {
      case 'financial':
        return [
          { title: "Общая выручка от NFT", value: formatNumber(metrics.totalNFTRevenue) + " USDT", 
            subValue: null, bgColor: "bg-blue-100" },
          { title: "Валовая прибыль", value: formatNumber(metrics.grossProfitAmount) + " USDT", 
            subValue: formatPercent(metrics.companyProfitPercentage) + "% от выручки", bgColor: "bg-green-100" },
          { title: "Чистая прибыль", value: formatNumber(metrics.netProfit) + " USDT", 
            subValue: "Маржа: " + formatPercent(metrics.netProfitMargin), bgColor: "bg-yellow-100" },
          { title: "Обратный выкуп (Buyback)", value: formatNumber(metrics.buybackAmount) + " USDT", 
            subValue: formatPercent(metrics.buybackPercentage) + "% от выручки", bgColor: "bg-purple-100" }
        ];
      case 'tokenomics':
        return [
          { title: "Цена токена", value: formatTokenPrice(metrics.lastTokenPrice) + " USDT", 
            subValue: "Изменение: " + formatPercent(metrics.tokenPriceChange), bgColor: "bg-blue-100" },
          { title: "Buyback объем", value: formatNumber(metrics.totalTokensBoughtBack) + " токенов", 
            subValue: formatNumber(metrics.buybackAmount) + " USDT", bgColor: "bg-green-100" },
          { title: "Капитализация", value: formatNumber(metrics.estimatedMarketCap) + " USDT", 
            subValue: "Циркулирующее предложение: " + formatNumber(metrics.finalCirculatingSupply), bgColor: "bg-yellow-100" },
          { title: "Моделируемая цена", value: formatTokenPrice(metrics.modeledTokenPrice) + " USDT", 
            subValue: "Модель с учетом buyback и токеномики", bgColor: "bg-purple-100" }
        ];
      case 'users':
        return [
          { title: "Пользователей", value: formatNumber(metrics.totalUsers), 
            subValue: "Рост: " + formatPercent(metrics.userGrowth), bgColor: "bg-blue-100" },
          { title: "Ср. LTV пользователя", value: formatNumber(metrics.avgLTV) + " USDT", 
            subValue: "Удержание: " + metrics.retentionRate + "%", bgColor: "bg-green-100" },
          { title: "Общая ценность пользователей", value: formatNumber(metrics.totalUserLTV) + " USDT", 
            subValue: "Потенциальная выручка", bgColor: "bg-yellow-100" },
          { title: "Активность", value: formatNumber(metrics.avgMeetingsPerDay) + " встреч/день", 
            subValue: "В среднем за период", bgColor: "bg-purple-100" }
        ];
      case 'simulation':
        return [
          { title: "Распределение доходов", value: `${formatPercent(metrics.buybackPercentage)} / ${formatPercent(metrics.userRewardsPercentage)} / ${formatPercent(metrics.companyProfitPercentage)}`, 
            subValue: "Buyback / Пользователи / Компания", bgColor: "bg-blue-100" },
          { title: "Влияние buyback на цену", value: formatPercent(metrics.buybackPriceImpact), 
            subValue: "% влияния при 100% ликвидности", bgColor: "bg-green-100" },
          { title: "Влияние распределения", value: formatPercent(metrics.rewardDistributionImpact), 
            subValue: "% влияния на цену токена", bgColor: "bg-yellow-100" },
          { title: "Настроение рынка", value: (metrics.marketSentiment > 0 ? '+' : '') + metrics.marketSentiment, 
            subValue: "От -10 (медвежий) до +10 (бычий)", bgColor: "bg-purple-100" }
        ];
      default:
        return [];
    }
  };

  const metricsData = getMetricsData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {metricsData.map((metric, index) => (
        <div key={index} className={`${metric.bgColor} p-4 rounded shadow`}>
          <h2 className="font-bold mb-2">{metric.title}</h2>
          <p className="text-xl">{metric.value}</p>
          {metric.subValue && <p className="text-sm">{metric.subValue}</p>}
        </div>
      ))}
    </div>
  );
};

// Компонент для навигации по вкладкам
const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'financial', label: 'Финансы и распределение доходов' },
    { id: 'tokenomics', label: 'Токеномика и анализ цены' },
    { id: 'users', label: 'Пользователи и LTV' },
    { id: 'simulation', label: 'Настройки симуляции' }
  ];

  return (
    <div className="flex mb-6 bg-white rounded shadow overflow-x-auto">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          className={`py-2 px-4 text-center flex-grow ${activeTab === tab.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// Компонент для графиков
const ChartContainer = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-white p-4 rounded shadow ${className}`}>
      <h2 className="font-bold mb-4">{title}</h2>
      <div className="h-64">
        {children}
      </div>
    </div>
  );
};

// Компонент таблицы
const DataTable = ({ title, columns, data, totals = null }) => {
  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="font-bold mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((column, index) => (
                <th key={index} className="p-2 border">{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="p-2 border">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
            {totals && (
              <tr className="bg-gray-200 font-bold">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="p-2 border">
                    {colIndex === 0 ? 'ИТОГО' : (totals[column.key] !== undefined ? 
                      (column.render ? column.render({ [column.key]: totals[column.key] }) : totals[column.key]) 
                      : '')}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Компонент для элемента настройки
const SettingInput = ({ label, value, onChange, type = "number", min, max, step, disabled = false, helperText = null, className = "" }) => {
  return (
    <div className={className}>
      <label className="block mb-1">{label}</label>
      {type === "range" ? (
        <>
          <input 
            type="range" 
            className="w-full"
            min={min}
            max={max}
            value={value}
            onChange={onChange}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{min} (Минимум)</span>
            <span>{(min + max) / 2} (Середина)</span>
            <span>{max} (Максимум)</span>
          </div>
        </>
      ) : (
        <input 
          type={type} 
          className="w-full p-2 border rounded" 
          value={value} 
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          readOnly={disabled}
          onChange={onChange}
        />
      )}
      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
};

// Компонент настроек распределения доходов
const RevenueDistributionSettings = ({ 
  buybackPercentage, setBuybackPercentage,
  userRewardsPercentage, setUserRewardsPercentage,
  companyProfitPercentage
}) => {
  const handleBuybackChange = (e) => {
    const newValue = Number(e.target.value);
    if (newValue + userRewardsPercentage <= 100) {
      setBuybackPercentage(newValue);
    }
  };

  const handleUserRewardsChange = (e) => {
    const newValue = Number(e.target.value);
    if (buybackPercentage + newValue <= 100) {
      setUserRewardsPercentage(newValue);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="font-bold mb-4">Настройка параметров распределения доходов</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <SettingInput 
          label="Buyback (%)"
          value={buybackPercentage}
          min={0}
          max={100}
          onChange={handleBuybackChange}
        />
        <SettingInput 
          label="Вознаграждения пользователям (%)"
          value={userRewardsPercentage}
          min={0}
          max={100}
          onChange={handleUserRewardsChange}
        />
        <SettingInput 
          label="Валовая прибыль компании (%)"
          value={companyProfitPercentage}
          disabled={true}
        />
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Сумма всех процентов должна быть равна 100%. Прибыль компании рассчитывается автоматически как оставшийся процент.
      </p>
    </div>
  );
};

// Компонент для вкладки финансов
const FinancialTab = ({ quarterlyData, summaryData, buybackPercentage, userRewardsPercentage, companyProfitPercentage }) => {
  // Данные для круговой диаграммы распределения доходов
  const revenueDistributionData = [
    { name: 'Обратный выкуп (Buyback)', value: buybackPercentage },
    { name: 'Вознаграждения пользователям', value: userRewardsPercentage },
    { name: 'Валовая прибыль компании', value: companyProfitPercentage }
  ];
  
  // Данные для круговой диаграммы распределения доходов в денежном выражении
  const revenueDistributionAmountData = [
    { name: 'Обратный выкуп (Buyback)', value: summaryData.buybackAmount || 0 },
    { name: 'Вознаграждения пользователям', value: summaryData.userRewardsAmount || 0 },
    { name: 'Валовая прибыль компании', value: summaryData.grossProfitAmount || 0 }
  ];
  
  // Константы для цветов
  const REVENUE_DISTRIBUTION_COLORS = ['#00C49F', '#FFBB28', '#FF8042'];
  
  // Столбцы для таблицы финансовых показателей
  const financialColumns = [
    { header: 'Квартал', key: 'quarter', render: (row) => `Q${row.quarter}` },
    { header: 'Выручка от NFT', key: 'nftRevenue', render: (row) => formatNumber(row.nftRevenue) },
    { header: 'Buyback', key: 'buybackAmount', render: (row) => formatNumber(row.buybackAmount) },
    { header: 'Пользователям', key: 'userRewardsAmount', render: (row) => formatNumber(row.userRewardsAmount) },
    { header: 'Валовая прибыль', key: 'grossProfitAmount', render: (row) => formatNumber(row.grossProfitAmount) },
    { header: 'Маркетинг', key: 'marketingCosts', render: (row) => formatNumber(row.marketingCosts) },
    { header: 'Операционные расходы', key: 'operationalCosts', render: (row) => formatNumber(row.operationalCosts) },
    { header: 'Чистая прибыль', key: 'netProfit', render: (row) => formatNumber(row.netProfit) },
    { header: 'Маржа', key: 'netProfitMargin', render: (row) => formatPercent(row.netProfitMargin) }
  ];
  
  // Итоги для таблицы
  const financialTotals = {
    nftRevenue: summaryData.totalNFTRevenue,
    buybackAmount: summaryData.buybackAmount,
    userRewardsAmount: summaryData.userRewardsAmount,
    grossProfitAmount: summaryData.grossProfitAmount,
    marketingCosts: summaryData.marketingCosts,
    operationalCosts: summaryData.operationalCosts,
    netProfit: summaryData.netProfit,
    netProfitMargin: summaryData.netProfitMargin
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Распределение доходов от NFT">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={revenueDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {revenueDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={REVENUE_DISTRIBUTION_COLORS[index % REVENUE_DISTRIBUTION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <ChartContainer title="Распределение доходов в денежном выражении">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={revenueDistributionAmountData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {revenueDistributionAmountData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={REVENUE_DISTRIBUTION_COLORS[index % REVENUE_DISTRIBUTION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(value) + ' USDT'} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Квартальная динамика выручки и прибыли">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" label={{ value: 'Квартал', position: 'insideBottom', offset: -5 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value, name) => {
                if (name === 'Маржа прибыли') return `${value.toFixed(1)}%`;
                return formatNumber(value) + ' USDT';
              }} />
              <Legend />
              <Bar yAxisId="left" dataKey="nftRevenue" name="Выручка от NFT" fill="#8884d8" />
              <Bar yAxisId="left" dataKey="grossProfitAmount" name="Валовая прибыль" fill="#82ca9d" />
              <Bar yAxisId="left" dataKey="netProfit" name="Чистая прибыль" fill="#FFBB28" />
              <Line yAxisId="right" type="monotone" dataKey="netProfitMargin" name="Маржа прибыли" stroke="#ff7300" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <ChartContainer title="Квартальная динамика распределения доходов">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" label={{ value: 'Квартал', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value) + ' USDT'} />
              <Legend />
              <Bar dataKey="buybackAmount" name="Обратный выкуп" stackId="a" fill="#00C49F" />
              <Bar dataKey="userRewardsAmount" name="Пользователям" stackId="a" fill="#FFBB28" />
              <Bar dataKey="grossProfitAmount" name="Валовая прибыль" stackId="a" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      <DataTable 
        title="Финансовые показатели по кварталам"
        columns={financialColumns}
        data={quarterlyData}
        totals={financialTotals}
      />
    </>
  );
};

// Компонент для вкладки токеномики
const TokenomicsTab = ({ quarterlyData, tokenMarketData }) => {
  // Столбцы для таблицы токеномики
  const tokenomicsColumns = [
    { header: 'Квартал', key: 'quarter', render: (row) => `Q${row.quarter}` },
    { header: 'Цена токена', key: 'actualTokenPrice', render: (row) => formatTokenPrice(row.actualTokenPrice) },
    { header: 'Моделируемая цена', key: 'modeledTokenPrice', render: (row) => formatTokenPrice(row.modeledTokenPrice) },
    { header: 'Выкуплено токенов', key: 'tokensBoughtBack', render: (row) => formatNumber(row.tokensBoughtBack) },
    { header: 'Распределено токенов', key: 'tokensDistributed', render: (row) => formatNumber(row.tokensDistributed) },
    { header: 'Циркулирующее предложение', key: 'circulatingSupply', render: (row) => formatNumber(row.circulatingSupply) },
    { header: 'Рыночная капитализация', key: 'marketCap', render: (row) => formatNumber(row.marketCap) },
    { header: 'Ликвидность', key: 'estimatedLiquidity', render: (row) => formatNumber(row.estimatedLiquidity) }
  ];

  // Данные для еженедельного отображения на графиках
  const weeklyTokenData = useMemo(() => {
    return tokenMarketData.filter((_, index) => index % 7 === 0);
  }, [tokenMarketData]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Динамика цены токена (реальная vs моделируемая)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTokenData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" label={{ value: 'День', position: 'insideBottom', offset: -5 }} />
              <YAxis tickFormatter={(value) => value.toFixed(6)} />
              <Tooltip formatter={(value) => value.toFixed(6) + ' USDT'} />
              <Legend />
              <Line type="monotone" dataKey="actualTokenPrice" name="Реальная цена" stroke="#8884d8" dot={false} />
              <Line type="monotone" dataKey="modeledTokenPrice" name="Моделируемая цена" stroke="#82ca9d" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <ChartContainer title="Объемы buyback и распределения токенов">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" label={{ value: 'Квартал', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value) + ' токенов'} />
              <Legend />
              <Bar dataKey="tokensBoughtBack" name="Выкуплено токенов" fill="#00C49F" />
              <Bar dataKey="tokensDistributed" name="Распределено токенов" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Факторы влияния на цену токена">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" label={{ value: 'Квартал', position: 'insideBottom', offset: -5 }} />
              <YAxis tickFormatter={(value) => (value * 100).toFixed(1) + '%'} />
              <Tooltip formatter={(value) => (value * 100).toFixed(2) + '%'} />
              <Legend />
              <Bar dataKey="buybackPriceEffect" name="Эффект buyback" fill="#00C49F" />
              <Bar dataKey="distributionPriceEffect" name="Эффект распределения" fill="#FFBB28" />
              <Bar dataKey="sentimentEffect" name="Эффект настроений рынка" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <ChartContainer title="Циркулирующее предложение токенов">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyTokenData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" label={{ value: 'День', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value) + ' токенов'} />
              <Legend />
              <Area type="monotone" dataKey="circulatingSupply" name="В обращении" fill="#8884d8" stroke="#8884d8" />
              <Area type="monotone" dataKey="rewardPool" name="Пул вознаграждений" fill="#82ca9d" stroke="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      <ChartContainer title="Соотношение маркет-капа и ликвидности" className="mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis 
              type="number" 
              dataKey="estimatedLiquidity" 
              name="Ликвидность (USDT)" 
              label={{ value: 'Ликвидность (USDT)', position: 'insideBottom', offset: -5 }}
              tickFormatter={(value) => formatNumber(value)}
            />
            <YAxis 
              type="number" 
              dataKey="marketCap" 
              name="Рыночная капитализация (USDT)" 
              label={{ value: 'Маркет-кап (USDT)', position: 'insideLeft', angle: -90, offset: -5 }}
              tickFormatter={(value) => formatNumber(value)}
            />
            <ZAxis type="number" range={[100, 1000]} dataKey="quarter" />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Ликвидность (USDT)' || name === 'Рыночная капитализация (USDT)') 
                  return formatNumber(value) + ' USDT';
                return value;
              }}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <Legend />
            <Scatter name="Квартальные показатели" data={quarterlyData} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      <DataTable 
        title="Токеномика по кварталам"
        columns={tokenomicsColumns}
        data={quarterlyData}
      />
    </>
  );
};

// Компонент для вкладки пользователей
const UsersTab = ({ quarterlyData }) => {
  // Столбцы для таблицы пользователей
  const usersColumns = [
    { header: 'Квартал', key: 'quarter', render: (row) => `Q${row.quarter}` },
    { header: 'Всего NFT', key: 'totalNFTs', render: (row) => formatNumber(row.totalNFTs) },
    { header: 'Активных NFT', key: 'activeTotalNFTs', render: (row) => formatNumber(row.activeTotalNFTs) },
    { header: '% активных', key: 'activePercentage', render: (row) => formatPercent((row.activeTotalNFTs / row.totalNFTs) * 100) },
    { header: 'Встреч за квартал', key: 'meetings', render: (row) => formatNumber(row.meetings) },
    { header: 'Встреч в день', key: 'meetingsPerDay', render: (row) => formatNumber(row.meetingsPerDay) },
    { header: 'Потенциальная ценность (LTV)', key: 'totalUserLTV', render: (row) => formatNumber(row.totalUserLTV) }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Рост числа пользователей по типам NFT">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" label={{ value: 'Квартал', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Area type="monotone" dataKey="silverNFTs" name="Silver NFT" stackId="1" fill="#8884d8" stroke="#8884d8" />
              <Area type="monotone" dataKey="goldNFTs" name="Gold NFT" stackId="1" fill="#82ca9d" stroke="#82ca9d" />
              <Area type="monotone" dataKey="platinumNFTs" name="Platinum NFT" stackId="1" fill="#ffc658" stroke="#ffc658" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <ChartContainer title="Активные vs общее число пользователей">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" label={{ value: 'Квартал', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar dataKey="totalNFTs" name="Всего NFT" fill="#8884d8" />
              <Bar dataKey="activeTotalNFTs" name="Активных NFT" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartContainer title="Общая потенциальная ценность пользователей (LTV)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" label={{ value: 'Квартал', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value) + ' USDT'} />
              <Legend />
              <Line type="monotone" dataKey="totalUserLTV" name="Общая ценность пользователей" stroke="#8884d8" />
              <Line type="monotone" dataKey="nftRevenue" name="Текущая выручка" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <ChartContainer title="Встречи и активность пользователей">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" label={{ value: 'Квартал', position: 'insideBottom', offset: -5 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar yAxisId="left" dataKey="meetings" name="Встречи за квартал" fill="#8884d8" />
              <Line yAxisId="right" type="monotone" dataKey="meetingsPerDay" name="Встреч в день" stroke="#82ca9d" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      <DataTable 
        title="Встречи, активность и LTV пользователей по кварталам"
        columns={usersColumns}
        data={quarterlyData}
      />
    </>
  );
};

// Компонент для вкладки настроек симуляции
const SimulationTab = ({ 
  buybackPercentage, setBuybackPercentage,
  userRewardsPercentage, setUserRewardsPercentage,
  companyProfitPercentage, setCompanyProfitPercentage,
  buybackPriceImpact, setBuybackPriceImpact,
  rewardDistributionImpact, setRewardDistributionImpact,
  marketSentiment, setMarketSentiment,
  operationalCostsBase, setOperationalCostsBase,
  operationalCostsPerUser, setOperationalCostsPerUser,
  marketingPercentage, setMarketingPercentage,
  silverPrice, setSilverPrice,
  goldPrice, setGoldPrice,
  platinumPrice, setPlatinumPrice,
  silverUserLTV, setSilverUserLTV,
  goldUserLTV, setGoldUserLTV,
  platinumUserLTV, setPlatinumUserLTV,
  retentionRate, setRetentionRate,
  initialTokenSupply, setInitialTokenSupply,
  initialRewardPool, setInitialRewardPool,
  initialLiquidity, setInitialLiquidity
}) => {
  return (
    <>
      <RevenueDistributionSettings 
        buybackPercentage={buybackPercentage}
        setBuybackPercentage={setBuybackPercentage}
        userRewardsPercentage={userRewardsPercentage}
        setUserRewardsPercentage={setUserRewardsPercentage}
        companyProfitPercentage={companyProfitPercentage}
      />
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-4">Настройка факторов влияния на цену токена</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <SettingInput 
            label="Влияние buyback на цену (%)"
            value={buybackPriceImpact}
            min={0}
            max={100}
            onChange={(e) => setBuybackPriceImpact(Number(e.target.value))}
            helperText="Процент влияния суммы buyback на цену токена (при соотношении с ликвидностью 1:1)"
          />
          <SettingInput 
            label="Влияние распределения токенов (%)"
            value={rewardDistributionImpact}
            min={0}
            max={100}
            onChange={(e) => setRewardDistributionImpact(Number(e.target.value))}
            helperText="Процент влияния распределения токенов на цену (негативное влияние)"
          />
          <SettingInput 
            label="Настроение рынка"
            value={marketSentiment}
            type="range"
            min={-10}
            max={10}
            onChange={(e) => setMarketSentiment(Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-4">Настройка расходов</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SettingInput 
            label="Базовые операционные расходы (USDT/квартал)"
            value={operationalCostsBase}
            onChange={(e) => setOperationalCostsBase(Number(e.target.value))}
          />
          <SettingInput 
            label="Расходы на пользователя (USDT/день)"
            value={operationalCostsPerUser}
            step="0.1"
            onChange={(e) => setOperationalCostsPerUser(Number(e.target.value))}
          />
          <SettingInput 
            label="Маркетинговые расходы (% от выручки)"
            value={marketingPercentage}
            min={0}
            max={100}
            onChange={(e) => setMarketingPercentage(Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-4">Настройка цен NFT</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SettingInput 
            label="Цена Silver NFT (USDT)"
            value={silverPrice}
            onChange={(e) => setSilverPrice(Number(e.target.value))}
          />
          <SettingInput 
            label="Цена Gold NFT (USDT)"
            value={goldPrice}
            onChange={(e) => setGoldPrice(Number(e.target.value))}
          />
          <SettingInput 
            label="Цена Platinum NFT (USDT)"
            value={platinumPrice}
            onChange={(e) => setPlatinumPrice(Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-4">Настройка LTV и удержания пользователей</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SettingInput 
            label="LTV Silver NFT (USDT)"
            value={silverUserLTV}
            onChange={(e) => setSilverUserLTV(Number(e.target.value))}
          />
          <SettingInput 
            label="LTV Gold NFT (USDT)"
            value={goldUserLTV}
            onChange={(e) => setGoldUserLTV(Number(e.target.value))}
          />
          <SettingInput 
            label="LTV Platinum NFT (USDT)"
            value={platinumUserLTV}
            onChange={(e) => setPlatinumUserLTV(Number(e.target.value))}
          />
          <SettingInput 
            label="Коэффициент удержания (%)"
            value={retentionRate}
            min={0}
            max={100}
            onChange={(e) => setRetentionRate(Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-bold mb-4">Настройка параметров токеномики</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SettingInput 
            label="Общее предложение токенов"
            value={initialTokenSupply}
            onChange={(e) => setInitialTokenSupply(Number(e.target.value))}
          />
          <SettingInput 
            label="Начальный пул вознаграждений"
            value={initialRewardPool}
            onChange={(e) => setInitialRewardPool(Number(e.target.value))}
          />
          <SettingInput 
            label="Начальная ликвидность (USDT)"
            value={initialLiquidity}
            onChange={(e) => setInitialLiquidity(Number(e.target.value))}
          />
        </div>
      </div>
    </>
  );
};

// Основной компонент приложения
const MEETDashboard = () => {
  // Загрузка данных
  const { isLoading, rawData, error } = useDataLoader();
  
  // Состояния для вкладок
  const [activeTab, setActiveTab] = useState('financial');
  
  // Состояния для настраиваемых параметров
  // Параметры NFT
  const [silverPrice, setSilverPrice] = useState(100);
  const [goldPrice, setGoldPrice] = useState(1000);
  const [platinumPrice, setPlatinumPrice] = useState(10000);
  
  // Параметры распределения доходов
  const [buybackPercentage, setBuybackPercentage] = useState(20);
  const [userRewardsPercentage, setUserRewardsPercentage] = useState(30);
  const [companyProfitPercentage, setCompanyProfitPercentage] = useState(50);
  
  // Операционные расходы
  const [operationalCostsBase, setOperationalCostsBase] = useState(50000);
  const [operationalCostsPerUser, setOperationalCostsPerUser] = useState(1);
  const [marketingPercentage, setMarketingPercentage] = useState(15);
  
  // Параметры токеномики
  const [initialTokenSupply, setInitialTokenSupply] = useState(1000000000); // 1 миллиард
  const [initialRewardPool, setInitialRewardPool] = useState(700000000); // 70% от общей эмиссии
  const [initialLiquidity, setInitialLiquidity] = useState(50000); // 50k USDT
  
  // Параметры для моделирования влияния buyback на цену токена
  const [buybackPriceImpact, setBuybackPriceImpact] = useState(15); // % влияния суммы buyback на цену (с учетом ликвидности)
  const [marketSentiment, setMarketSentiment] = useState(0); // от -10 до 10, влияние настроений рынка
  const [rewardDistributionImpact, setRewardDistributionImpact] = useState(8); // % влияния распределения токенов на цену
  
  // User LTV параметры
  const [silverUserLTV, setSilverUserLTV] = useState(120); // USDT
  const [goldUserLTV, setGoldUserLTV] = useState(1200); // USDT
  const [platinumUserLTV, setPlatinumUserLTV] = useState(12000); // USDT
  const [retentionRate, setRetentionRate] = useState(70); // %
  
  // Состояния для обработанных данных
  const [quarterlyData, setQuarterlyData] = useState([]);
  const [tokenMarketData, setTokenMarketData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  
  // Обновление компонента прибыли при изменении распределения доходов
  useEffect(() => {
    setCompanyProfitPercentage(100 - buybackPercentage - userRewardsPercentage);
  }, [buybackPercentage, userRewardsPercentage]);
  
  // Функция обработки данных
  const processData = useCallback((data) => {
    // Здесь вся логика обработки данных из предыдущей версии
    // (код опущен для краткости)
    
    // Агрегирование данных по кварталам
    const DAYS_IN_QUARTER = 91; // Примерно 3 месяца
    const quarters = [];
    
    // Массив для хранения данных о токене
    const tokenData = [];
    
    // Переменные для отслеживания токеномики
    let currentRewardPool = initialRewardPool;
    let currentCirculatingSupply = initialTokenSupply - initialRewardPool; // Начальное кол-во токенов в обращении
    let totalTokensBoughtBack = 0;
    let cumulativeBuybackAmount = 0;
    
    for (let i = 0; i < data.length; i += DAYS_IN_QUARTER) {
      const endIndex = Math.min(i + DAYS_IN_QUARTER - 1, data.length - 1);
      const startRow = data[i];
      const endRow = data[endIndex];
      
      // Рассчитываем общее количество встреч за квартал
      let totalMeetings = 0;
      let totalNewNFTs = 0;
      let totalNFTValue = 0;
      
      for (let j = i; j <= endIndex; j++) {
        totalMeetings += data[j]['Встречи'] || 0;
        totalNewNFTs += data[j]['Новые NFT'] || 0;
        totalNFTValue += data[j]['Стоимость новых NFT'] || 0;
      }
      
      // Получаем приращение NFT за квартал
      const startSilver = i === 0 ? 0 : data[i-1]['NFT lvl1'] || 0;
      const startGold = i === 0 ? 0 : data[i-1]['NFT lvl2'] || 0;
      const startPlatinum = i === 0 ? 0 : data[i-1]['NFT lvl3'] || 0;
      
      const newSilver = endRow['NFT lvl1'] - startSilver;
      const newGold = endRow['NFT lvl2'] - startGold;
      const newPlatinum = endRow['NFT lvl3'] - startPlatinum;
      
      // Расчет выручки на основе актуальных цен
      const silverRevenue = newSilver * silverPrice;
      const goldRevenue = newGold * goldPrice;
      const platinumRevenue = newPlatinum * platinumPrice;
      const quarterNFTRevenue = silverRevenue + goldRevenue + platinumRevenue;
      
      // Распределение доходов
      const buybackAmount = quarterNFTRevenue * (buybackPercentage / 100);
      const userRewardsAmount = quarterNFTRevenue * (userRewardsPercentage / 100);
      const grossProfitAmount = quarterNFTRevenue * (companyProfitPercentage / 100);
      
      // Обновление суммарного buyback
      cumulativeBuybackAmount += buybackAmount;
      
      // Маркетинговые расходы (процент от выручки)
      const marketingCosts = quarterNFTRevenue * (marketingPercentage / 100);
      
      // Операционные расходы
      const avgActiveUsers = (
        (startRow['Активных NFT lvl1'] + endRow['Активных NFT lvl1']) / 2 + 
        (startRow['Активных NFT lvl2'] + endRow['Активных NFT lvl2']) / 2 + 
        (startRow['Активных NFT lvl3'] + endRow['Активных NFT lvl3']) / 2
      );
      
      const userRelatedCosts = avgActiveUsers * operationalCostsPerUser * (endRow['Шаг'] - startRow['Шаг'] + 1);
      const baseCosts = operationalCostsBase;
      const totalOperationalCosts = baseCosts + userRelatedCosts;
      
      // Чистая прибыль
      const netProfit = grossProfitAmount - marketingCosts - totalOperationalCosts;
      const netProfitMargin = quarterNFTRevenue > 0 ? (netProfit / quarterNFTRevenue) * 100 : 0;
      
      // Токеномика - расчет влияния buyback и распределения токенов на цену
      const actualTokenPrice = endRow['Цена токена'];
      
      // Расчет количества выкупленных токенов
      const tokensBoughtBack = buybackAmount / actualTokenPrice;
      totalTokensBoughtBack += tokensBoughtBack;
      
      // Расчет количества распределенных токенов пользователям
      const tokensDistributed = userRewardsAmount / actualTokenPrice;
      
      // Обновление пула вознаграждений и циркулирующего предложения
      currentRewardPool = endRow['REWARD_POOL токены'] || 0;  // Берем из реальных данных
      currentCirculatingSupply = initialTokenSupply - currentRewardPool;
      
      // Расчет рыночной капитализации
      const marketCap = currentCirculatingSupply * actualTokenPrice;
      
      // Расчет ликвидности (оценка)
      const estimatedLiquidity = initialLiquidity + (cumulativeBuybackAmount * 0.5); // Предполагаем, что 50% средств buyback повышают ликвидность
      
      // Моделирование влияния buyback на цену токена
      // Расчет прогнозируемого изменения цены на основе buyback и других факторов
      const liquidityRatio = buybackAmount / estimatedLiquidity;
      const buybackPriceEffect = liquidityRatio * (buybackPriceImpact / 100);
      const distributionPriceEffect = (tokensDistributed / currentCirculatingSupply) * (rewardDistributionImpact / 100) * -1;
      const sentimentEffect = marketSentiment / 100; // Влияние настроений рынка
      
      const modeledTokenPrice = i === 0 ? 
        actualTokenPrice : 
        quarters[quarters.length - 1].modeledTokenPrice * (1 + buybackPriceEffect + distributionPriceEffect + sentimentEffect);
      
      // LTV и удержание пользователей
      const silverLTV = silverUserLTV * (retentionRate / 100);
      const goldLTV = goldUserLTV * (retentionRate / 100);
      const platinumLTV = platinumUserLTV * (retentionRate / 100);
      
      const totalUserLTV = (endRow['NFT lvl1'] * silverLTV) + (endRow['NFT lvl2'] * goldLTV) + (endRow['NFT lvl3'] * platinumLTV);
      
      quarters.push({
        quarter: Math.floor(i / DAYS_IN_QUARTER) + 1,
        dayStart: startRow['Шаг'],
        dayEnd: endRow['Шаг'],
        silverNFTs: endRow['NFT lvl1'],
        goldNFTs: endRow['NFT lvl2'],
        platinumNFTs: endRow['NFT lvl3'],
        activeSilverNFTs: endRow['Активных NFT lvl1'],
        activeGoldNFTs: endRow['Активных NFT lvl2'],
        activePlatinumNFTs: endRow['Активных NFT lvl3'],
        totalNFTs: endRow['NFT lvl1'] + endRow['NFT lvl2'] + endRow['NFT lvl3'],
        activeTotalNFTs: endRow['Активных NFT lvl1'] + endRow['Активных NFT lvl2'] + endRow['Активных NFT lvl3'],
        meetings: totalMeetings,
        meetingsPerDay: totalMeetings / (endRow['Шаг'] - startRow['Шаг'] + 1),
        rewardPool: endRow['REWARD_POOL токены'],
        newNFTs: totalNewNFTs,
        newNFTsValue: totalNFTValue,
        // Данные из файла
        newSilver,
        newGold,
        newPlatinum,
        // Финансовые показатели
        nftRevenue: quarterNFTRevenue,
        silverRevenue,
        goldRevenue,
        platinumRevenue,
        buybackAmount,
        userRewardsAmount,
        grossProfitAmount,
        marketingCosts,
        operationalCosts: totalOperationalCosts,
        netProfit,
        netProfitMargin,
        // Токеномика
        actualTokenPrice,
        modeledTokenPrice,
        tokensBoughtBack,
        tokensDistributed,
        circulatingSupply: currentCirculatingSupply,
        marketCap,
        estimatedLiquidity,
        // Факторы влияния на цену
        buybackPriceEffect,
        distributionPriceEffect,
        sentimentEffect,
        // LTV
        totalUserLTV,
        avgLifetimeValue: totalUserLTV / (endRow['NFT lvl1'] + endRow['NFT lvl2'] + endRow['NFT lvl3'])
      });
      
      // Добавляем в массив данных о токене каждый день квартала
      for (let j = i; j <= endIndex; j++) {
        const day = data[j]['Шаг'];
        const tokenPrice = data[j]['Цена токена'];
        const rewardPool = data[j]['REWARD_POOL токены'];
        
        // Для модели цены токена применяем ежедневный коэффициент роста
        const dailyBuybackEffect = buybackPriceEffect / DAYS_IN_QUARTER;
        const dailyDistributionEffect = distributionPriceEffect / DAYS_IN_QUARTER;
        const dailySentimentEffect = sentimentEffect / DAYS_IN_QUARTER;
        
        // Расчет моделируемой цены токена на основе реальной цены на начало квартала
        const quarterStartTokenPrice = data[i]['Цена токена'];
        const daysSinceQuarterStart = j - i;
        const cumulativeEffect = (1 + dailyBuybackEffect + dailyDistributionEffect + dailySentimentEffect) ** daysSinceQuarterStart;
        const modeledDailyTokenPrice = quarterStartTokenPrice * cumulativeEffect;
        
        tokenData.push({
          day,
          actualTokenPrice: tokenPrice,
          modeledTokenPrice: modeledDailyTokenPrice,
          rewardPool,
          circulatingSupply: initialTokenSupply - rewardPool
        });
      }
    }
    
    // Расчет сводных показателей
    const totalNFTRevenue = quarters.reduce((sum, q) => sum + q.nftRevenue, 0);
    const totalBuybackAmount = quarters.reduce((sum, q) => sum + q.buybackAmount, 0);
    const totalUserRewardsAmount = quarters.reduce((sum, q) => sum + q.userRewardsAmount, 0);
    const totalGrossProfitAmount = quarters.reduce((sum, q) => sum + q.grossProfitAmount, 0);
    const totalMarketingCosts = quarters.reduce((sum, q) => sum + q.marketingCosts, 0);
    const totalOperationalCosts = quarters.reduce((sum, q) => sum + q.operationalCosts, 0);
    const totalNetProfit = totalGrossProfitAmount - totalMarketingCosts - totalOperationalCosts;
    const totalNetProfitMargin = totalNFTRevenue > 0 ? (totalNetProfit / totalNFTRevenue) * 100 : 0;
    
    // Расчет средней цены токена и изменения
    const firstTokenPrice = data[0]['Цена токена'];
    const lastTokenPrice = data[data.length - 1]['Цена токена'];
    const tokenPriceChange = ((lastTokenPrice / firstTokenPrice) - 1) * 100;
    
    // Расчет средней цены токена (взвешенной по времени)
    const avgTokenPrice = data.reduce((sum, row) => sum + row['Цена токена'], 0) / data.length;
    
    // Рыночная капитализация на конец периода
    const finalCirculatingSupply = initialTokenSupply - data[data.length - 1]['REWARD_POOL токены'];
    const estimatedMarketCap = finalCirculatingSupply * lastTokenPrice;
    
    // Расчет метрик для пользователей
    const firstRow = data[0];
    const lastRow = data[data.length - 1];
    
    const initialUsers = firstRow['NFT lvl1'] + firstRow['NFT lvl2'] + firstRow['NFT lvl3'];
    const finalUsers = lastRow['NFT lvl1'] + lastRow['NFT lvl2'] + lastRow['NFT lvl3']; 
    const userGrowth = ((finalUsers / initialUsers) - 1) * 100;
    
    const totalMeetings = data.reduce((sum, row) => sum + (row['Встречи'] || 0), 0);
    const avgMeetingsPerDay = totalMeetings / data.length;
    
    // Установка обработанных данных
    setQuarterlyData(quarters);
    setTokenMarketData(tokenData);
    
    setSummaryData({
      totalNFTRevenue,
      buybackAmount: totalBuybackAmount,
      userRewardsAmount: totalUserRewardsAmount,
      grossProfitAmount: totalGrossProfitAmount,
      marketingCosts: totalMarketingCosts,
      operationalCosts: totalOperationalCosts,
      netProfit: totalNetProfit,
      netProfitMargin: totalNetProfitMargin,
      totalTokensBoughtBack,
      avgTokenPrice,
      tokenPriceChange,
      estimatedMarketCap,
      firstTokenPrice,
      lastTokenPrice,
      finalCirculatingSupply,
      buybackPercentage,
      userRewardsPercentage,
      companyProfitPercentage,
      initialUsers,
      finalUsers,
      totalUsers: finalUsers,
      userGrowth,
      totalMeetings,
      avgMeetingsPerDay,
      modeledTokenPrice: quarters.length > 0 ? quarters[quarters.length-1].modeledTokenPrice : 0,
      avgLTV: quarters.length > 0 ? quarters[quarters.length-1].avgLifetimeValue : 0,
      totalUserLTV: quarters.length > 0 ? quarters[quarters.length-1].totalUserLTV : 0,
      retentionRate,
      buybackPriceImpact,
      rewardDistributionImpact,
      marketSentiment
    });
  }, [
    silverPrice, goldPrice, platinumPrice,
    buybackPercentage, userRewardsPercentage, companyProfitPercentage,
    operationalCostsBase, operationalCostsPerUser, marketingPercentage,
    initialTokenSupply, initialRewardPool, initialLiquidity,
    buybackPriceImpact, marketSentiment, rewardDistributionImpact,
    silverUserLTV, goldUserLTV, platinumUserLTV, retentionRate
  ]);
  
  // Обработка данных при их загрузке или изменении параметров
  useEffect(() => {
    if (rawData.length > 0) {
      processData(rawData);
    }
  }, [
    rawData, processData
  ]);
  
  // Обработка ошибок загрузки
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Ошибка при загрузке данных: {error}</p>
        <p>Убедитесь, что файл 'results.csv' доступен и имеет правильную структуру.</p>
      </div>
    );
  }
  
  // Отображение загрузки
  if (isLoading) {
    return <div className="p-8 text-center">Загрузка данных...</div>;
  }

  // Основной интерфейс
  return (
    <div className="p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-center">Оптимизированный дашборд токеномики MEEET</h1>
      
      {/* Навигация по вкладкам */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Ключевые метрики для текущей вкладки */}
      <MetricsPanel metrics={summaryData} type={activeTab} />
      
      {/* Содержимое текущей вкладки */}
      {activeTab === 'financial' && (
        <FinancialTab 
          quarterlyData={quarterlyData} 
          summaryData={summaryData}
          buybackPercentage={buybackPercentage}
          userRewardsPercentage={userRewardsPercentage}
          companyProfitPercentage={companyProfitPercentage}
        />
      )}
      
      {activeTab === 'tokenomics' && (
        <TokenomicsTab 
          quarterlyData={quarterlyData} 
          tokenMarketData={tokenMarketData}
        />
      )}
      
      {activeTab === 'users' && (
        <UsersTab 
          quarterlyData={quarterlyData}
        />
      )}
      
      {activeTab === 'simulation' && (
        <SimulationTab 
          buybackPercentage={buybackPercentage}
          setBuybackPercentage={setBuybackPercentage}
          userRewardsPercentage={userRewardsPercentage}
          setUserRewardsPercentage={setUserRewardsPercentage}
          companyProfitPercentage={companyProfitPercentage}
          setCompanyProfitPercentage={setCompanyProfitPercentage}
          buybackPriceImpact={buybackPriceImpact}
          setBuybackPriceImpact={setBuybackPriceImpact}
          rewardDistributionImpact={rewardDistributionImpact}
          setRewardDistributionImpact={setRewardDistributionImpact}
          marketSentiment={marketSentiment}
          setMarketSentiment={setMarketSentiment}
          operationalCostsBase={operationalCostsBase}
          setOperationalCostsBase={setOperationalCostsBase}
          operationalCostsPerUser={operationalCostsPerUser}
          setOperationalCostsPerUser={setOperationalCostsPerUser}
          marketingPercentage={marketingPercentage}
          setMarketingPercentage={setMarketingPercentage}
          silverPrice={silverPrice}
          setSilverPrice={setSilverPrice}
          goldPrice={goldPrice}
          setGoldPrice={setGoldPrice}
          platinumPrice={platinumPrice}
          setPlatinumPrice={setPlatinumPrice}
          silverUserLTV={silverUserLTV}
          setSilverUserLTV={setSilverUserLTV}
          goldUserLTV={goldUserLTV}
          setGoldUserLTV={setGoldUserLTV}
          platinumUserLTV={platinumUserLTV}
          setPlatinumUserLTV={setPlatinumUserLTV}
          retentionRate={retentionRate}
          setRetentionRate={setRetentionRate}
          initialTokenSupply={initialTokenSupply}
          setInitialTokenSupply={setInitialTokenSupply}
          initialRewardPool={initialRewardPool}
          setInitialRewardPool={setInitialRewardPool}
          initialLiquidity={initialLiquidity}
          setInitialLiquidity={setInitialLiquidity}
        />
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Примечание: Данная модель основана на реальных данных симуляции MEEET за 730 дней (2 года) и показывает распределение доходов от продажи NFT, а также влияние buyback и других факторов на цену токена.</p>
        <p className="mt-2">Токены EEE и NFT MEEET являются утилитарными цифровыми активами и не предназначены для использования как инвестиционные инструменты.</p>
      </div>
    </div>
  );
};

export default MEETDashboard;
