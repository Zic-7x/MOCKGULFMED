import { Link } from 'react-router-dom';
import './PoliciesIndex.css';

const PoliciesIndex = () => {
  return (
    <article className="policies-index">
      <h1>Policies</h1>
      <p className="policies-index-lead">
        Legal and commercial terms for using MockGulfMed. Select a document below.
      </p>
      <ul className="policies-index-list">
        <li>
          <Link to="/policies/terms">
            Terms and conditions
            <span>Using the Service, accounts, liability, and payments.</span>
          </Link>
        </li>
        <li>
          <Link to="/policies/refund">
            Refund policy
            <span>Payment terms and refund eligibility.</span>
          </Link>
        </li>
      </ul>
    </article>
  );
};

export default PoliciesIndex;
