import { NotificationBell } from '../components/NotificationBell';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <strong>FlowDesk</strong>

            <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <a href="/">Home</a>
              <a href="/dashboard">Dashboard</a>
              <a href="/initiatives">Initiatives</a>
              <a href="/decisions">Decisions</a>
              <a href="/login">Login</a>
              <NotificationBell />
            </nav>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
