import { Link } from 'react-router-dom';
import './TermsAndConditions.css';

const TermsAndConditions = () => {
  return (
    <article className="terms-conditions">
      <h1>Terms and conditions</h1>
      <p className="terms-conditions-updated">Last updated: April 13, 2026</p>

      <section>
        <h2>Agreement</h2>
        <p>
          These Terms and Conditions (“Terms”) govern your access to and use of MockGulfMed (the “Service”), including
          our website, exam portal, content, and related features. By creating an account, purchasing access, or using
          the Service, you agree to these Terms. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>The Service</h2>
        <p>
          MockGulfMed provides online practice exams, materials, and tools intended to help medical and health
          professionals prepare for assessments. We may update, add, or remove features, exams, or content at any time.
          The Service is offered on an “as available” basis.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <p>
          You must provide accurate registration information and keep your login credentials confidential. You are
          responsible for all activity under your account. Notify us promptly if you suspect unauthorized access. We may
          suspend or terminate accounts that violate these Terms or pose a risk to the Service or other users.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Copy, scrape, redistribute, or publicly share exam content or answers except as expressly allowed in the interface</li>
          <li>Attempt to bypass access controls, quotas, or technical limits</li>
          <li>Use the Service in any unlawful way or to harass, harm, or mislead others</li>
          <li>Introduce malware or interfere with the security or operation of the Service</li>
          <li>Share your account with others or use another person’s account</li>
        </ul>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          The Service, including questions, explanations, branding, software, and design, is owned by MockGulfMed or
          its licensors. We grant you a limited, non-exclusive, non-transferable right to use the Service for your
          personal preparation in line with these Terms. No other rights are granted.
        </p>
      </section>

      <section>
        <h2>Not professional or medical advice</h2>
        <p>
          Content is for exam preparation and learning only. It is not a substitute for professional judgment,
          clinical training, or regulatory requirements in your jurisdiction. You are solely responsible for decisions
          you make in your profession and for complying with applicable laws and licensing bodies.
        </p>
      </section>

      <section>
        <h2>Fees and payments</h2>
        <p>
          Paid plans, packages, or subscriptions are billed as shown at checkout. Taxes may apply where required.
          Payment obligations are non-cancellable except as stated in our{' '}
          <Link to="/policies/refund">Refund policy</Link>. By paying, you authorize charges in accordance with the
          pricing shown for your purchase.
        </p>
      </section>

      <section>
        <h2>Disclaimer of warranties</h2>
        <p>
          To the fullest extent permitted by law, the Service is provided “as is” without warranties of any kind,
          whether express or implied, including merchantability, fitness for a particular purpose, or non-infringement.
          We do not warrant uninterrupted or error-free operation or that results will meet your expectations.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, MockGulfMed and its operators shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill, arising
          from your use of the Service. Our total liability for any claim relating to the Service shall not exceed the
          amount you paid us for the Service in the twelve (12) months before the claim, or one hundred dollars (USD
          $100), whichever is greater, except where liability cannot be limited by applicable law.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or end your access if you breach these Terms or if
          we discontinue the Service. Provisions that by their nature should survive (e.g., intellectual property,
          disclaimers, limitation of liability) will survive termination.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may modify these Terms by posting an updated version on the Service with a new “Last updated” date.
          Continued use after changes constitutes acceptance of the revised Terms, except where applicable law requires
          additional steps.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          These Terms are interpreted in accordance with applicable law, without regard to conflict-of-law principles,
          except where mandatory consumer or local protections in your place of residence apply and cannot be waived.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For questions about these Terms, use the same support or administrative channel associated with your account
          or registration.
        </p>
      </section>
    </article>
  );
};

export default TermsAndConditions;
