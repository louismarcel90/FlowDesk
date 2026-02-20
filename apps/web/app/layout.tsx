import NotificationBell from '../components/NotificationBell';
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="fd-header">
          <div className="fd-header-inner">
            <div className="fd-brand">
              <a href="/">
              <div className="fd-mark" />
              <div className="fd-brand-title">
                <strong>FlowDesk</strong>
                <span>Decision Intelligence & Governance</span>
              </div>
              </a>
            </div>

            <nav className="fd-nav">
              {/* <a href="/">Home</a> */}
              <a href="/about">About</a>
              <a href="/contact">Contact</a>
              {/* <a href="/decisions">Decisions</a> */}
              {/* <a href="/ops/notifications">Ops</a> */}
              <a href="/login">Login</a>
              <NotificationBell />
            </nav>
          </div>
        </header>

        <div className="fd-shell">{children}</div>
      </body>
    </html>
  );
}
