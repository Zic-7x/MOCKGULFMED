import { Link } from 'react-router-dom';
import { usePageSeo } from '../../utils/usePageSeo';
import './PoliciesIndex.css';

const PoliciesIndex = () => {
  usePageSeo({
    title: 'Legal Policies · ClickToGulf Exams',
    description: 'Official policies and terms for ClickToGulf Exams.',
    noindex: true,
  });

  return (
    <article className="policies-index">
      <h1>Policies</h1>
      <p className="policies-index-lead">
        Legal and commercial terms for using ClickToGulf Exams. Select a document below.
      </p>
      <ul className="policies-index-list">
        <li>
          <Link to="/policies/terms" rel="nofollow">
            Terms and conditions
            <span>Using the Service, accounts, liability, and payments.</span>
          </Link>
        </li>
        <li>
          <Link to="/policies/refund" rel="nofollow">
            Refund policy
            <span>Payment terms and refund eligibility.</span>
          </Link>
        </li>
      </ul>
    </article>
  );
};

export default PoliciesIndex;
