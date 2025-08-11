import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info } from 'lucide-react';

export function FairSurgeBanner() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Pricing Policy</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Info className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>
          We use demand-based pricing with transparent caps to keep it fair for everyone.
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Surge is capped (typically up to +30%).</li>
          <li>“Affordable Hours” are highlighted when demand is low.</li>
          <li>No hidden fees. You always see the final price.</li>
        </ul>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-2">Learn about Fair Surge</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fair Surge and Affordable Hours</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                Prices adjust slightly with expected demand to keep courts available and reduce
                last-minute crowding. We limit surges with strict caps so prices remain fair.
              </p>
              <p>
                When demand is low (rush score below 0.4), we mark slots as <strong>Affordable Hours</strong>,
                so you can find better deals easily.
              </p>
              <p>
                This policy is transparent and designed to benefit both players and venue owners.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
