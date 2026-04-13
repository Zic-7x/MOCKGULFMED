import './RefundPolicy.css';

const RefundPolicy = () => {
  return (
    <article className="refund-policy">
      <h1>Refund policy</h1>
      <p className="refund-policy-updated">Last updated: April 13, 2026</p>

      <section>
        <h2>Overview</h2>
        <p>
          All purchases of subscriptions, packages, digital access, or related services on MockGulfMed are{' '}
          <strong>final</strong>. We do <strong>not</strong> provide refunds, credits, or charge reversals for any
          amount paid, except where required by applicable law.
        </p>
      </section>

      <section>
        <h2>No refunds</h2>
        <p>
          By completing a purchase, you acknowledge and agree that you are not entitled to a refund for any reason,
          including but not limited to:
        </p>
        <ul>
          <li>Dissatisfaction with the service or content</li>
          <li>Non-use, partial use, or discontinued use of the platform</li>
          <li>Failure to pass an exam or meet personal goals</li>
          <li>Technical issues on your device or network (where the service remains available as designed)</li>
          <li>Account suspension or termination for violation of our terms or policies</li>
          <li>Duplicate or mistaken purchases</li>
        </ul>
      </section>

      <section>
        <h2>Subscriptions and renewals</h2>
        <p>
          If a subscription renews automatically, you are responsible for canceling before the renewal date if you do
          not wish to continue. Renewal fees are not refundable.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          General questions about billing or access may be directed through your usual support channel. This policy
          does not create any right to a refund.
        </p>
      </section>
    </article>
  );
};

export default RefundPolicy;
