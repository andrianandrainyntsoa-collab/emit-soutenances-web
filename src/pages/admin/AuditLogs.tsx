import { useEffect, useState } from 'react';
import { Eraser } from 'lucide-react';
import { Audit } from '../../api/endpoints';
import type { AuditLog } from '../../types';
import {
  Bouton,
  Carte,
  Champ,
  Etiquette,
  MessageErreur,
  Tableau,
  champCss,
  formatDateHeure,
  messageApiErreur,
} from '../../components/ui';

export default function AuditLogs() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filtres, setFiltres] = useState({ action: '', entite: '', date_debut: '', date_fin: '' });
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const charger = (p = page) =>
    Audit.liste({
      page: p,
      per_page: 30,
      action: filtres.action || undefined,
      entite: filtres.entite || undefined,
      date_debut: filtres.date_debut || undefined,
      date_fin: filtres.date_fin || undefined,
    })
      .then((r) => {
        setItems(r.data.data);
        setPage(r.data.current_page);
        setLastPage(r.data.last_page);
      })
      .catch((e) => setErreur(messageApiErreur(e)));

  useEffect(() => {
    charger(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nettoyer = async () => {
    if (
      !window.confirm(
        'Nettoyer les journaux de traçabilité ?\n\nToutes les entrées affichées seront supprimées. ' +
          'Une trace de cette opération de nettoyage sera conservée.'
      )
    ) {
      return;
    }
    setErreur(null);
    setSucces(null);
    setEnCours(true);
    try {
      const r = await Audit.nettoyer();
      setSucces(r.data.message ?? 'Journaux nettoyés.');
      charger(1);
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Journaux de traçabilité</h1>
          <p className="text-sm text-slate-500">
            Conformité RG17 : traces des opérations importantes effectuées dans le système.
          </p>
        </div>
        <Bouton variante="danger" onClick={nettoyer} desactive={enCours}>
          <Eraser size={15} /> {enCours ? 'Nettoyage…' : 'Nettoyer'}
        </Bouton>
      </div>

      <MessageErreur erreur={erreur} />
      {succes && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
          {succes}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Champ label="Action contient">
          <input
            className={champCss}
            value={filtres.action}
            onChange={(e) => setFiltres({ ...filtres, action: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && charger(1)}
            placeholder="VALIDATION…"
          />
        </Champ>
        <Champ label="Entité">
          <input
            className={champCss}
            value={filtres.entite}
            onChange={(e) => setFiltres({ ...filtres, entite: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && charger(1)}
            placeholder="resultats…"
          />
        </Champ>
        <Champ label="Du">
          <input
            type="date"
            className={champCss}
            value={filtres.date_debut}
            onChange={(e) => setFiltres({ ...filtres, date_debut: e.target.value })}
          />
        </Champ>
        <Champ label="Au">
          <input
            type="date"
            className={champCss}
            value={filtres.date_fin}
            onChange={(e) => setFiltres({ ...filtres, date_fin: e.target.value })}
          />
        </Champ>
      </div>

      <Carte>
        <Tableau entetes={['Date', 'Utilisateur', 'Action', 'Entité', 'Description', 'IP']} vide={items.length === 0}>
          {items.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDateHeure(l.created_at)}</td>
              <td className="px-4 py-2.5 text-sm">{l.user?.name ?? '—'}</td>
              <td className="px-4 py-2.5">
                <Etiquette couleur="bleu">{l.action}</Etiquette>
              </td>
              <td className="px-4 py-2.5 text-xs text-slate-500">
                {l.entite}
                {l.entite_id ? ` #${l.entite_id}` : ''}
              </td>
              <td className="px-4 py-2.5 text-sm text-slate-600">{l.description ?? '—'}</td>
              <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{l.adresse_ip ?? '—'}</td>
            </tr>
          ))}
        </Tableau>

        {lastPage > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-slate-500">Page {page} / {lastPage}</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded border" disabled={page <= 1} onClick={() => charger(page - 1)}>Précédent</button>
              <button className="px-3 py-1.5 rounded border" disabled={page >= lastPage} onClick={() => charger(page + 1)}>Suivant</button>
            </div>
          </div>
        )}
      </Carte>
    </div>
  );
}
