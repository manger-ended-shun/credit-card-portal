'use client';
 
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SearchLog } from '@/types/database';
import { timeAgo } from '@/utils/helpers';
import { Search, TrendingUp, Clock } from 'lucide-react';
 
export function SearchAnalytics() {
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSearches: 0,
    uniqueQueries: 0,
    avgResults: 0,
  });
  
  useEffect(() => {
    fetchSearchLogs();
  }, []);
  
  const fetchSearchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('search_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      setSearchLogs(data || []);
      
      // Calculate stats
      if (data && data.length > 0) {
        const uniqueQueries = new Set(data.map(log => log.query_normalized)).size;
        const avgResults = data.reduce((sum, log) => sum + (log.results_count || 0), 0) / data.length;
        
        setStats({
          totalSearches: data.length,
          uniqueQueries,
          avgResults: Math.round(avgResults * 10) / 10,
        });
      }
    } catch (error) {
      console.error('Error fetching search logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Searches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSearches}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unique Queries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueQueries}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Results</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgResults}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Searches */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Recent Searches</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {searchLogs.slice(0, 20).map(log => (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{log.query}</p>
                  <p className="text-sm text-gray-500">
                    {log.results_count !== null ? `${log.results_count} results` : 'No results'}
                  </p>
                </div>
                <span className="text-sm text-gray-400">
                  {timeAgo(log.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {searchLogs.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No search history yet
          </div>
        )}
      </div>
    </div>
  );
}