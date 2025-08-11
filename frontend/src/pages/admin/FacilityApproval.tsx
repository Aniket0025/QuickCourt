import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { approveVenue, getPendingVenues, rejectVenue, type VenueSummary } from '@/lib/api';
import { toast } from 'sonner';

const FacilityApproval = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  const [items, setItems] = useState<VenueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  async function load() {
    try {
      setError(undefined);
      const data = await getPendingVenues();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet><title>Facility Approval | QuickCourt</title></Helmet>
      <h1 className="text-3xl font-bold mb-6">Facility Approval</h1>

      <Card>
        <CardHeader><CardTitle>Pending Submissions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="text-sm text-muted-foreground">Loading pending venues…</div>
          )}
          {error && (
            <div className="text-sm text-red-500">{error} <button className="underline" onClick={load}>Retry</button></div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="text-sm text-muted-foreground">No pending facilities.</div>
          )}
          {!loading && !error && items.map(p => (
            <div key={p._id} className="flex items-center justify-between border border-border/50 rounded-md p-3 bg-card/50">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.address || '—'} · {(p.sports || []).join(', ') || 'No sports set'}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-secondary hover:bg-secondary/90"
                  onClick={async () => {
                    try { await approveVenue(p._id); toast.success('Facility approved'); load(); } catch { toast.error('Failed to approve'); }
                  }}
                >Approve</Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    try { await rejectVenue(p._id); toast.success('Facility rejected'); load(); } catch { toast.error('Failed to reject'); }
                  }}
                >Reject</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacilityApproval;
