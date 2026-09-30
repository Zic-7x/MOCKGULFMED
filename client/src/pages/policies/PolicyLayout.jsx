import { Link, Outlet } from 'react-router-dom';
import { usePageSeo } from '../../utils/usePageSeo';
const logoUrl = '/logo.svg';
import './PolicyLayout.css';

const PolicyLayout = () => {
  usePageSeo({
    title: 'Terms & Policies · ClickToGulf Exams',
    description: 'Legal policies, terms of service, and refund terms for ClickToGulf Exams.',
    noindex: true,
  });

  return (
    <div className="policy-layout">
      <header className="policy-layout-top">
        <div className="policy-layout-top-inner">
          <Link to="/" className="policy-layout-brand">
            <img className="policy-layout-logo" src={logoUrl} alt="ClickToGulf Exams" />
            <span className="sr-only">ClickToGulf Exams</span>
          </Link>
          <Link className="policy-layout-home" to="/">
            Back to home
          </Link>
        </div>
      </header>
      <main className="policy-layout-main">
        <Outlet />
      </main>
      <footer className="policy-layout-footer">
        <div className="policy-layout-footer-inner">
          <Link to="/">Home</Link>
          <span className="policy-layout-sep" aria-hidden="true">
            •
          </span>
          <Link to="/about">About ClickToGulf</Link>
          <span className="policy-layout-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies" rel="nofollow">Policies</Link>
          <span className="policy-layout-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies/terms" rel="nofollow">Terms</Link>
          <span className="policy-layout-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies/refund" rel="nofollow">Refund</Link>
        </div>
      </footer>
    </div>
  );
};

export default PolicyLayout;
