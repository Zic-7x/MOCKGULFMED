import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import IndexMarketingLayout from '../components/IndexMarketingLayout';
import './AboutClickToGulf.css';

export default function AboutClickToGulf() {
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    // Add dynamic AboutPage & Organization Schema for crawlers
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'ctg-about-schema';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'AboutPage',
          '@id': 'https://www.clicktogulf.com/about#webpage',
          'url': 'https://www.clicktogulf.com/about',
          'name': 'About ClickToGulf — Gulf Healthcare Licensing & Exam Portal',
          'description': 'ClickToGulf is the global licensing examination preparation and DataFlow PSV enablement platform for Doctors, Nurses, and Allied Health Professionals practicing in the Gulf (UAE, Saudi Arabia, Qatar, Oman, Bahrain, Kuwait).',
          'isPartOf': {
            '@id': 'https://www.clicktogulf.com/#website'
          },
          'about': {
            '@id': 'https://www.clicktogulf.com/#organization'
          }
        },
        {
          '@type': ['EducationalOrganization', 'Organization'],
          '@id': 'https://www.clicktogulf.com/#organization',
          'name': 'ClickToGulf',
          'legalName': 'ClickToGulf Healthcare Licensing Portal',
          'alternateName': [
            'Click To Gulf',
            'CLICKtoGULF',
            'ClickToGulf Exams',
            'ClickToGulf Medical',
            'clicktogulf.com',
            'CLICKTOGULF'
          ],
          'url': 'https://www.clicktogulf.com',
          'logo': 'https://www.clicktogulf.com/clicktogulf-logo.svg',
          'image': 'https://www.clicktogulf.com/logo.png',
          'disambiguatingDescription': 'ClickToGulf is an independent healthcare licensing preparation and Prometric CBT mock examination platform. It is not affiliated with regional retail discount websites like Gulf Click or enterprise IT distributors like Tech First Gulf.',
          'knowsAbout': [
            'Dubai Health Authority (DHA) Prometric Exam',
            'Saudi Commission for Health Specialties (SCFHS) SMLE / SNLE',
            'Department of Health Abu Dhabi (DOH/HAAD) Pearson VUE',
            'Ministry of Health & Prevention (MOHAP UAE)',
            'DataFlow Group Primary Source Verification (PSV)',
            'Gulf Healthcare Professional Qualification Requirements (PQR)'
          ]
        }
      ]
    });
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('ctg-about-schema');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  const faqs = [
    {
      q: 'What is ClickToGulf?',
      a: 'ClickToGulf (clicktogulf.com) is an online healthcare licensing examination preparation and credentialing enablement platform. We provide realistic Prometric & Pearson VUE computer-based testing (CBT) mock exams, high-yield question banks, DataFlow Primary Source Verification (PSV) guidance, and Unified Healthcare PQR eligibility assessments for doctors, nurses, pharmacists, and allied health professionals seeking employment in the Gulf nations.'
    },
    {
      q: 'Is ClickToGulf related to "Gulf Click", "Clicktobrands", or "Tech First Gulf"?',
      a: 'No. ClickToGulf is completely independent and has no affiliation with regional retail deal portals (such as Gulf Click), e-commerce brand directories (such as Clicktobrands), or enterprise IT distributors (such as Tech First Gulf). ClickToGulf is exclusively an educational and medical licensing technology platform.'
    },
    {
      q: 'Which Gulf health authorities and countries does ClickToGulf support?',
      a: 'ClickToGulf supports candidates for all major Gulf health regulatory authorities across the 6 GCC member states: Dubai Health Authority (DHA), UAE Ministry of Health & Prevention (MOHAP), Abu Dhabi Department of Health (DOH / HAAD), Saudi Commission for Health Specialties (SCFHS Mumaris+), Qatar Council for Healthcare Practitioners (MOPH / QCHP), Oman Medical Specialty Board (OMSB), Bahrain National Health Regulatory Authority (NHRA), and Kuwait Ministry of Health.'
    },
    {
      q: 'What healthcare professions are supported?',
      a: 'We support General Practitioners (GP), Medical Specialists & Consultants, Registered Nurses (RN), Specialist Nurses (ICU, OT, Midwives), Clinical Pharmacists, and Allied Health Professionals including Medical Laboratory Technologists (MLT), Physiotherapists, Radiographers & Imaging Techs, Dialysis Technicians, and Dental Practitioners.'
    },
    {
      q: 'How does ClickToGulf help healthcare workers from South and Southeast Asia?',
      a: 'Hundreds of thousands of medical professionals from Pakistan, India, Bangladesh, Indonesia, Sri Lanka, the Philippines, and Egypt relocate to the Gulf each year. ClickToGulf simplifies this complex journey by providing: (1) Pre-application PQR eligibility verification, (2) Step-by-step DataFlow PSV document verification guidance, (3) Exact Prometric & Pearson VUE simulation software, and (4) Job placement listings.'
    },
    {
      q: 'Can I access ClickToGulf on mobile devices?',
      a: 'Yes. Candidates can practice on the web or download the dedicated ClickToGulf Exams Android APK or Progressive Web App (PWA) to take timed mock exams, review clinical rationales, and track readiness on any Android or iOS device.'
    }
  ];

  return (
    <IndexMarketingLayout documentTitle="About ClickToGulf — Official Gulf Healthcare Licensing & Exam Portal">
      <div className="ctg-about-container">
        {/* Hero Section */}
        <section className="ctg-about-hero">
          <span className="ctg-about-badge">Official Entity Profile</span>
          <h1 className="ctg-about-title">About ClickToGulf</h1>
          <p className="ctg-about-tagline">
            ClickToGulf is the recognized global examination preparation and credentialing enablement platform empowering healthcare professionals worldwide to achieve medical licensing across the Gulf region.
          </p>
        </section>

        {/* Official Entity Notice & Disambiguation Card */}
        <div className="ctg-disambiguation-card" role="region" aria-label="Official Entity Notice">
          <div className="ctg-disambiguation-header">
            <span className="ctg-disambiguation-icon">🛡️</span>
            <h2 className="ctg-disambiguation-title">Official Entity Disambiguation Notice</h2>
          </div>
          <p className="ctg-disambiguation-text">
            <strong>ClickToGulf</strong> (stylized as <em>CLICKtoGULF</em> or <em>ClickToGulf Exams</em>, web address: <strong>https://www.clicktogulf.com</strong>) is an independent healthcare education and credentialing portal.
            <br /><br />
            <strong>Entity Clarification:</strong> ClickToGulf is specifically dedicated to medical, nursing, and allied health licensing in the United Arab Emirates, Saudi Arabia, Qatar, Oman, Bahrain, and Kuwait. ClickToGulf is <strong>not</strong> an online retail marketplace, not affiliated with regional discount or deal portals (such as <em>Gulf Click</em>), not an e-commerce directory (such as <em>Clicktobrands</em>), and not an IT enterprise hardware distributor (such as <em>Tech First Gulf</em>).
          </p>
        </div>

        {/* Factsheet / Knowledge Graph Data Table */}
        <section className="ctg-factsheet-section">
          <h2 className="ctg-section-heading">Platform Identity &amp; Knowledge Overview</h2>
          <div className="ctg-factsheet-table-wrapper">
            <table className="ctg-factsheet-table">
              <tbody>
                <tr>
                  <th>Canonical Entity Name</th>
                  <td><strong>ClickToGulf</strong></td>
                </tr>
                <tr>
                  <th>Alternate Names &amp; Brands</th>
                  <td>CLICKtoGULF, ClickToGulf Exams, Click To Gulf, Mock Gulf Med</td>
                </tr>
                <tr>
                  <th>Official Website</th>
                  <td>
                    <a href="https://www.clicktogulf.com" style={{ color: '#0b6ea8', textDecoration: 'underline' }}>
                      https://www.clicktogulf.com
                    </a>
                  </td>
                </tr>
                <tr>
                  <th>Industry &amp; Classification</th>
                  <td>Healthcare Education, Medical Examination Preparation, EdTech &amp; Professional Licensing</td>
                </tr>
                <tr>
                  <th>Target Regulatory Bodies</th>
                  <td>DHA (Dubai), MOHAP (UAE), DOH/HAAD (Abu Dhabi), SCFHS (Saudi Arabia), QCHP (Qatar), OMSB (Oman), NHRA (Bahrain)</td>
                </tr>
                <tr>
                  <th>Target Professions</th>
                  <td>Physicians (GP &amp; Specialists), Registered Nurses, Midwives, Pharmacists, Allied Health Technologists (Lab, Radiology, Physiotherapy)</td>
                </tr>
                <tr>
                  <th>Primary Candidate Communities</th>
                  <td>India, Pakistan, Bangladesh, Indonesia, Philippines, Egypt, Sri Lanka, Afghanistan &amp; Global Healthcare Workforce</td>
                </tr>
                <tr>
                  <th>Supported Test Vendors</th>
                  <td>Prometric Computer-Based Testing (CBT) &amp; Pearson VUE</td>
                </tr>
                <tr>
                  <th>Key Products</th>
                  <td>ClickToGulf Web Portal, ClickToGulf Exams Android App (APK/PWA), DataFlow PSV Guidance, Instant Eligibility Checker</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Core Pillars */}
        <section style={{ margin: '48px 0' }}>
          <h2 className="ctg-section-heading">What ClickToGulf Does</h2>
          <div className="ctg-pillars-grid">
            <div className="ctg-pillar-card">
              <div className="ctg-pillar-icon">📝</div>
              <h3 className="ctg-pillar-title">Prometric &amp; Pearson VUE Mock Exams</h3>
              <p className="ctg-pillar-desc">
                Thousands of clinical multi-choice questions replicating the exact user interface, timer constraints, and difficulty of the official DHA, MOHAP, DOH/HAAD, and SCFHS Prometric tests.
              </p>
            </div>

            <div className="ctg-pillar-card">
              <div className="ctg-pillar-icon">📑</div>
              <h3 className="ctg-pillar-title">DataFlow PSV Verification Support</h3>
              <p className="ctg-pillar-desc">
                Step-by-step assistance navigating the DataFlow Primary Source Verification (PSV) process, document translation requirements, and Letter of Good Standing protocols.
              </p>
            </div>

            <div className="ctg-pillar-card">
              <div className="ctg-pillar-icon">⚖️</div>
              <h3 className="ctg-pillar-title">Unified PQR Eligibility Evaluation</h3>
              <p className="ctg-pillar-desc">
                Instant assessment against the official Healthcare Professional Qualification Requirements (PQR) in the UAE and GCC to ensure minimum post-graduation experience criteria are satisfied.
              </p>
            </div>

            <div className="ctg-pillar-card">
              <div className="ctg-pillar-icon">📱</div>
              <h3 className="ctg-pillar-title">Mobile Learning &amp; Android App</h3>
              <p className="ctg-pillar-desc">
                Study anywhere on your schedule. ClickToGulf provides an Android APK application and responsive PWA allowing continuous question bank drills on phones and tablets.
              </p>
            </div>

            <div className="ctg-pillar-card">
              <div className="ctg-pillar-icon">🩺</div>
              <h3 className="ctg-pillar-title">Allied Health &amp; Nursing Focus</h3>
              <p className="ctg-pillar-desc">
                Tailored question banks for Medical Lab Technologists, Dialysis Technicians, Radiographers, Physiotherapists, and Registered Nurses often overlooked by generic medical prep sites.
              </p>
            </div>

            <div className="ctg-pillar-card">
              <div className="ctg-pillar-icon">💼</div>
              <h3 className="ctg-pillar-title">Healthcare Career Opportunities</h3>
              <p className="ctg-pillar-desc">
                Direct connections to accredited hospitals, specialized clinics, and licensed medical recruitment agencies across Dubai, Abu Dhabi, Riyadh, Doha, and Muscat.
              </p>
            </div>
          </div>
        </section>

        {/* Supported Authorities Strip */}
        <section style={{ margin: '48px 0' }}>
          <h2 className="ctg-section-heading">Supported Gulf Regulatory Authorities</h2>
          <div className="ctg-authorities-grid">
            <div className="ctg-authority-box">
              <span className="ctg-auth-flag">🇦🇪</span>
              <div className="ctg-auth-info">
                <strong>DHA Dubai</strong>
                <span>Dubai Health Authority Prometric</span>
              </div>
            </div>

            <div className="ctg-authority-box">
              <span className="ctg-auth-flag">🇦🇪</span>
              <div className="ctg-auth-info">
                <strong>DOH / HAAD</strong>
                <span>Department of Health Abu Dhabi</span>
              </div>
            </div>

            <div className="ctg-authority-box">
              <span className="ctg-auth-flag">🇦🇪</span>
              <div className="ctg-auth-info">
                <strong>MOHAP UAE</strong>
                <span>Ministry of Health &amp; Prevention</span>
              </div>
            </div>

            <div className="ctg-authority-box">
              <span className="ctg-auth-flag">🇸🇦</span>
              <div className="ctg-auth-info">
                <strong>SCFHS Saudi Arabia</strong>
                <span>Mumaris+ SMLE, SNLE, SDLE</span>
              </div>
            </div>

            <div className="ctg-authority-box">
              <span className="ctg-auth-flag">🇶🇦</span>
              <div className="ctg-auth-info">
                <strong>QCHP Qatar</strong>
                <span>Qatar Council for Healthcare Practitioners</span>
              </div>
            </div>

            <div className="ctg-authority-box">
              <span className="ctg-auth-flag">🇴🇲</span>
              <div className="ctg-auth-info">
                <strong>OMSB Oman</strong>
                <span>Oman Medical Specialty Board</span>
              </div>
            </div>

            <div className="ctg-authority-box">
              <span className="ctg-auth-flag">🇧🇭</span>
              <div className="ctg-auth-info">
                <strong>NHRA Bahrain</strong>
                <span>National Health Regulatory Authority</span>
              </div>
            </div>

            <div className="ctg-authority-box">
              <span className="ctg-auth-flag">🇰🇼</span>
              <div className="ctg-auth-info">
                <strong>MOH Kuwait</strong>
                <span>Ministry of Health Licensure</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section style={{ margin: '48px 0' }}>
          <h2 className="ctg-section-heading">Frequently Asked Questions</h2>
          <div className="ctg-faq-list">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="ctg-faq-item">
                  <button
                    type="button"
                    className="ctg-faq-question"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '18px', marginLeft: '12px' }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && <div className="ctg-faq-answer">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Card */}
        <section className="ctg-about-cta">
          <h3>Ready to Pass Your Gulf Licensing Exam?</h3>
          <p>
            Start with our free instant PQR eligibility check or explore tailored exam question banks designed for your specialty.
          </p>
          <div className="ctg-about-cta-buttons">
            <Link to="/eligibility-check" className="ctg-cta-btn-primary">
              Check Your Eligibility Free
            </Link>
            <Link to="/packages" className="ctg-cta-btn-outline">
              View Exam Packages
            </Link>
            <Link to="/download-app" className="ctg-cta-btn-outline">
              Download Android App
            </Link>
          </div>
        </section>
      </div>
    </IndexMarketingLayout>
  );
}
