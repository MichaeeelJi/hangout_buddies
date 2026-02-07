
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface CategoryStat {
  name: string;
  value: number;
}

interface LocationStat {
  name: string;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function EventStatistics() {
  const [categoryData, setCategoryData] = useState<CategoryStat[]>([]);
  const [locationData, setLocationData] = useState<LocationStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('category, city')
        .gte('event_date', new Date().toISOString()); // Only upcoming events

      if (error) throw error;

      if (events) {
        // Process Categories
        const catCounts: Record<string, number> = {};
        events.forEach(e => {
          const cat = e.category || 'Uncategorized';
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        const catStats = Object.entries(catCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        setCategoryData(catStats);

        // Process Locations
        const locCounts: Record<string, number> = {};
        events.forEach(e => {
          const loc = e.city || 'Unknown';
          locCounts[loc] = (locCounts[loc] || 0) + 1;
        });

        const locStats = Object.entries(locCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 cities

        setLocationData(locStats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (categoryData.length === 0 && locationData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Category Distribution */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <PieChartIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Event Categories</h3>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location Distribution */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Top Locations</h3>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={locationData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
