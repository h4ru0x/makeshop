
type Client = {
  id: string;
  username: string;
  email: string;
  phone?: string;
};

type Props = {
  open: boolean;
  client?: Client | null;
  clients?: Client[];
  onClose: () => void;
};

export default function DetailClientView({ open, client, clients, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="card" style={{ width: '90%', maxWidth: '720px', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>{client ? 'Client details' : 'Clients'}</h2>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        {client && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <strong>Username</strong>
              <div style={{ marginTop: '0.5rem' }}>{client.username}</div>
            </div>
            <div>
              <strong>Email</strong>
              <div style={{ marginTop: '0.5rem' }}>{client.email}</div>
            </div>
            <div>
              <strong>Phone</strong>
              <div style={{ marginTop: '0.5rem' }}>{client.phone || '-'}</div>
            </div>
            <div>
              <strong>ID</strong>
              <div style={{ marginTop: '0.5rem' }}>{client.id}</div>
            </div>
          </div>
        )}

        {clients && (
          <div>
            <table className="data-table" style={{ width: '100%', marginTop: '0.5rem' }}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td>{c.username}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
