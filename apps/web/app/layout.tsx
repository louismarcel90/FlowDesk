export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <strong>FlowDesk</strong>
            <nav style={{ display: 'flex', gap: 12 }}>
              <a href="/">Dashboard</a>
              <a href="/decisions">Decisions</a>
              <a href="/initiatives">Initiatives</a>
              <a href="/admin/policies">Policies</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
