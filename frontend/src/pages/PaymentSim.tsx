import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { createBooking } from '@/lib/api';

interface PaymentState {
  venueId: string;
  courtId: string;
  dateTime: string;
  durationHours: number;
}

const PaymentSim = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as Partial<PaymentState>;

  const canProceed = Boolean(user && state.venueId && state.courtId && state.dateTime && state.durationHours);

  const handleProceed = async () => {
    if (!canProceed) {
      toast.error('Missing booking details. Please select court and slot again.');
      navigate(-1);
      return;
    }
    try {
      // Simulate payment processing latency
      await new Promise((r) => setTimeout(r, 800));

      await createBooking({
        userId: user!.id,
        venueId: state.venueId!,
        courtId: state.courtId!,
        dateTime: state.dateTime!,
        durationHours: state.durationHours!,
      });

      toast.success('Payment successful and booking confirmed.');
      navigate('/bookings', { replace: true });
    } catch (e: any) {
      toast.error(e?.message || 'Failed to confirm booking');
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>Payment Simulation</title>
        <link rel="canonical" href="/payment" />
      </Helmet>

      <Card>
        <CardHeader>
          <CardTitle>Payment Simulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This is a demo payment page. No real payment is processed.
          </p>
          <div className="text-sm">
            <div>Venue ID: <span className="font-mono">{state.venueId || '-'}</span></div>
            <div>Court ID: <span className="font-mono">{state.courtId || '-'}</span></div>
            <div>Time: <span className="font-mono">{state.dateTime ? new Date(state.dateTime).toLocaleString() : '-'}</span></div>
            <div>Duration: <span className="font-mono">{state.durationHours ?? '-'}</span> hour(s)</div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" asChild>
              <Link to={-1 as unknown as string}>Go Back</Link>
            </Button>
            <Button onClick={handleProceed} disabled={!canProceed} className="grow">
              Proceed to My Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSim;
