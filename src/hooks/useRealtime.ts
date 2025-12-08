import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeContributions() {
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial contributions
    async function fetchContributions() {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          users (
            name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setContributions(data);
      }
      setLoading(false);
    }

    fetchContributions();

    // Subscribe to new contributions
    const channel = supabase
      .channel('contributions-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions',
        },
        async (payload) => {
          // Fetch user data for the new contribution
          const { data: userData } = await supabase
            .from('users')
            .select('name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newContribution = {
            ...payload.new,
            users: userData,
          };

          setContributions((prev) => [newContribution, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { contributions, loading };
}

export function useRealtimePlantStats() {
  const [plantStats, setPlantStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial stats
    async function fetchStats() {
      const { data, error } = await supabase
        .from('plant_stats')
        .select('*')
        .single();

      if (data) {
        setPlantStats(data);
      }
      setLoading(false);
    }

    fetchStats();

    // Subscribe to stats updates
    const channel = supabase
      .channel('plant-stats-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'plant_stats',
        },
        (payload) => {
          setPlantStats(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { plantStats, loading };
}
