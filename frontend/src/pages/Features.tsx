import { Helmet } from "react-helmet-async";

const Features = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl">
      <Helmet>
        <title>Features & Updates • QuickCourt</title>
        <meta name="description" content="See what's included in QuickCourt and what's coming next." />
      </Helmet>

      <h1 className="text-3xl font-bold mb-2">Features & Updates</h1>
      <p className="text-muted-foreground mb-8">
        We're continuously improving QuickCourt. Here's a snapshot of core features and recent updates.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border/50 p-5">
          <h2 className="text-xl font-semibold mb-2">Core Features</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Browse venues with rich details and availability</li>
            <li>Instant court booking and secure payments</li>
            <li>Manage bookings from your profile</li>
            <li>Venue owner dashboard for slots, courts, and approvals</li>
            <li>Admin tools to approve facilities and manage users</li>
          </ul>
        </div>

        <div className="rounded-lg border border-border/50 p-5">
          <h2 className="text-xl font-semibold mb-2">Recent Updates</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Improved booking flow and error handling</li>
            <li>Performance tweaks across venue lists</li>
            <li>Refined UI components and accessibility</li>
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 p-5 mt-6">
        <h2 className="text-xl font-semibold mb-2">Roadmap</h2>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Notifications and reminders</li>
          <li>Discounts and promotions</li>
          <li>Team and league management</li>
        </ul>
      </div>
    </div>
  );
};

export default Features;
