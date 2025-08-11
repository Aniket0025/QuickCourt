import { Helmet } from "react-helmet-async";

const Terms = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 prose prose-invert max-w-3xl">
      <Helmet>
        <title>Customer Terms • QuickCourt</title>
        <meta name="description" content="QuickCourt Customer Terms of Service." />
      </Helmet>

      <h1 className="text-3xl font-bold">Customer Terms</h1>
      <p className="text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
      <p>
        By creating an account or making a booking on QuickCourt, you agree to these Terms.
      </p>

      <h2 className="text-xl font-semibold">2. Bookings & Cancellations</h2>
      <ul className="list-disc pl-6">
        <li>Bookings are subject to venue availability and confirmation.</li>
        <li>Cancellation and refund policies may vary by venue.</li>
      </ul>

      <h2 className="text-xl font-semibold">3. User Responsibilities</h2>
      <ul className="list-disc pl-6">
        <li>Provide accurate information and respect venue rules.</li>
        <li>Use the platform lawfully and refrain from abusive behavior.</li>
      </ul>

      <h2 className="text-xl font-semibold">4. Liability</h2>
      <p>
        QuickCourt is a booking platform and is not responsible for venue operations. To the maximum extent permitted by law, our liability is limited to fees paid for the affected booking.
      </p>

      <h2 className="text-xl font-semibold">5. Contact</h2>
      <p>For questions about these Terms, email: legal@quickcourt.app.</p>
    </div>
  );
};

export default Terms;
