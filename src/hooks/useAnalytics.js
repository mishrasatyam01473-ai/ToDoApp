/**
 * Productivity Analytics Custom Hook
 * Manages metrics, timeframes, and chart datasets
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getProductivitySummary,
  getLineChartData,
  getBarChartData,
  getDotChartData,
} from '../services/analyticsService';

export const useAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [lineChartData, setLineChartData] = useState(null);
  const [lineTimeframe, setLineTimeframe] = useState(7); // 7, 30, 90
  const [barChartData, setBarChartData] = useState(null);
  const [barMode, setBarMode] = useState('weekly'); // 'weekly' or 'monthly'
  const [dotChartData, setDotChartData] = useState(null);
  const [dotTimeframe, setDotTimeframe] = useState(30); // 30 or 90
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [sum, line, bar, dot] = await Promise.all([
        getProductivitySummary(),
        getLineChartData(lineTimeframe),
        getBarChartData(barMode),
        getDotChartData(dotTimeframe),
      ]);

      setSummary(sum);
      setLineChartData(line);
      setBarChartData(bar);
      setDotChartData(dot);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [lineTimeframe, barMode, dotTimeframe]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const changeLineTimeframe = async (days) => {
    setLineTimeframe(days);
    const data = await getLineChartData(days);
    setLineChartData(data);
  };

  const changeBarMode = async (mode) => {
    setBarMode(mode);
    const data = await getBarChartData(mode);
    setBarChartData(data);
  };

  const changeDotTimeframe = async (days) => {
    setDotTimeframe(days);
    const data = await getDotChartData(days);
    setDotChartData(data);
  };

  return {
    summary,
    lineChartData,
    lineTimeframe,
    changeLineTimeframe,
    barChartData,
    barMode,
    changeBarMode,
    dotChartData,
    dotTimeframe,
    changeDotTimeframe,
    loading,
    refreshAnalytics: loadAll,
  };
};

