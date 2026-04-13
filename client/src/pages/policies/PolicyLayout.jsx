import { Link, Outlet } from 'react-router-dom';
import logoUrl from '../../image/Gemini_Generated_Image_wtgqj3wtgqj3wtgq-removebg-preview.png';
import './PolicyLayout.css';

const PolicyLayout = () => {
  return (
    <div className="policy-layout">
      <header className="policy-layout-top">
        <div className="policy-layout-top-inner">
          <Link to="/" className="policy-layout-brand">
            <img className="policy-layout-logo" src={logoUrl} alt="MockGulfMed" />
            <span className="sr-only">MockGulfMed</span>
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
          <span>MockGulfMed</span>
          <span className="policy-layout-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies">Policies</Link>
          <span className="policy-layout-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies/terms">Terms</Link>
          <span className="policy-layout-sep" aria-hidden="true">
            •
          </span>
          <Link to="/policies/refund">Refund</Link>
        </div>
      </footer>
    </div>
  );
};

export default PolicyLayout;
