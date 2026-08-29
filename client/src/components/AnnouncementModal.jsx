import { useEffect, useState } from 'react';
import './AnnouncementModal.css';

const AnnouncementModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const dismiss = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') dismiss();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="announcement-modal-overlay"
      role="presentation"
      onClick={dismiss}
    >
      <div
        className="announcement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="announcement-modal-header">
          <span className="announcement-modal-badge">Important Notice</span>
          <h2 id="announcement-modal-title" className="announcement-modal-title">
            Official Announcements
          </h2>
        </header>

        <div className="announcement-modal-body">
          <section className="announcement-modal-section">
            <h3>Official Notice</h3>
            <p>
              Effective <strong>25 July 2026</strong>, our agency will suspend all licensing and
              sponsored examination services in Pakistan until further notice.
            </p>
            <p>
              This decision has been made due to repeated instances of unprofessional conduct,
              failure to honor commitments, and persistent delays in payments by certain medical
              professionals. These ongoing issues have made it impossible for us to continue offering
              these services under the current circumstances.
            </p>
            <p>Please note the following:</p>
            <ul>
              <li>
                No new applications or examination bookings will be accepted by our agency or any of
                our authorized representatives after 25 July 2026.
              </li>
              <li>
                All applicants who have already been officially onboarded before this date will
                continue to receive full support, and their cases will remain active until their
                licensure process has been successfully completed.
              </li>
            </ul>
            <p>
              We appreciate the understanding and cooperation of all affected applicants.
            </p>
          </section>

          <section className="announcement-modal-section">
            <h3>Examination Schedule Update</h3>
            <p>
              All examinations previously scheduled for July, August, September, October, November,
              and December 2026 have been postponed.
            </p>
            <p>
              To minimize further delays, these examinations will be conducted on an urgent priority
              basis during <strong>August 2026</strong>. Applicants are advised to continue their
              preparation and remain ready for revised examination dates and further instructions.
            </p>
            <p>
              Please note that no new examination bookings will be accepted by our agency or any of
              its representatives after 25 July 2026.
            </p>
            <p>Thank you for your cooperation and understanding.</p>
          </section>
        </div>

        <footer className="announcement-modal-footer">
          <button type="button" className="announcement-modal-btn" onClick={dismiss}>
            I understand
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AnnouncementModal;
