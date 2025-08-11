import { Helmet } from "react-helmet-async";

const Privacy = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 prose prose-invert max-w-3xl">
      <Helmet>
        <title>Privacy Policy • QuickCourt</title>
        <meta name="description" content="Read QuickCourt's Privacy Policy to learn how we collect, use, and protect your data." />
      </Helmet>
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <p>
        QuickCourt respects your privacy. This page describes the information we collect when you use our services
        and how we use, share, and protect it.
      </p>

      <h2 className="text-xl font-semibold">Information We Collect</h2>
      <ul className="list-disc pl-6">
        <li>Account information (name, email, phone)</li>
        <li>Booking details (venue, time, payment status)</li>
        <li>Usage and device data to improve our service</li>
      </ul>

      <h2 className="text-xl font-semibold">How We Use Information</h2>
      <ul className="list-disc pl-6">
        <li>Provide and maintain the QuickCourt service</li>
        <li>Process bookings and payments</li>
        <li>Communicate updates and support</li>
        <li>Improve safety, reliability, and performance</li>
      </ul>

      <h2 className="text-xl font-semibold">Your Choices</h2>
      <p>You may access, update, or delete your account information from your profile. For any requests, contact us at support@quickcourt.app.</p>

      <h2 className="text-xl font-semibold">Contact</h2>
      <p>If you have questions about this policy, contact us at privacy@quickcourt.app.</p>
    </div>
  );
};

export default Privacy;
