import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Unlock, Lock } from 'lucide-react';
import { Sessions as SessionsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import type { SessionSoutenance } from '../../types';
import {
  Bouton,
  Carte,
  Champ,
  Etiquette,
  MessageErreur,
  Modale,
  Tableau,
  champCss,
  formatDate,
  messageApiErreur,
} from '../../components/ui';

const VIDE = { nom: '', date_debut: '', date_fin: '', annee_universitaire: '', description: '' };

export default function Sessions() {
  const { role } = useAuth();
  const estAdministrateur = role === 'administrateur';
  const [items, setItems] = useState<SessionSoutenance[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modale, setModale] = useState<SessionSoutenance | null>(null);
  const [form, setForm] = useState({ ...VIDE });
  const [nouveau, setNouveau] = useState(true);

  const charger = () =>
    SessionsApi.liste().then((r) => setItems(r.data)).catch((e) => setErreur(messageApiErreur(e)));

  useEffect(() => { charger(); }, []);

  const couleurStatut = (s: string) =>
    s === 'ouverte' ? 'vert' : s === 'cloturee' ? 'rouge' : 'ambre';

  const ouvrirCreation = () => {
    setForm({ ...VIDE });
    setNouveau(true);
    setModale({} as SessionSoutenance);
  };

  const ouvrirModif = (s: SessionSoutenance) => {
    setForm({
      nom: s.nom,
      date_debut: s.date_debut?.substring(0, 10) ?? '',
      date_fin: s.date_fin?.substring(0, 10) ?? '',
      annee_universitaire: s.annee_universitaire,
      description: s.description ?? '',
    });
    setNouveau(false);
    setModale(s);
  };

  const enregistrer = async () => {
    if (!modale) return;
    setErreur(null);
    try {
      if (nouveau) await SessionsApi.creer(form);
      else await SessionsApi.maj(modale.id, form);
      setModale(null);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const transition = async (s: SessionSoutenance, action: 'ouvrir' | 'cloturer') => {
    if (action === 'cloturer') {
      const message =
        `Clôturer la session « ${s.nom} » ?\n\n` +
        'Toutes les planifications de soutenance associées à cette session passeront ' +
        'automatiquement à l\'état « Terminée ». Cette action est définitive.';
      if (!window.confirm(message)) return;
    } else if (!window.confirm(`Confirmer l'ouverture de la session « ${s.nom} » ?`)) {
      return;
    }
    try {
      const r = await (action === 'ouvrir' ? SessionsApi.ouvrir(s.id) : SessionsApi.cloturer(s.id));
      if (r.data?.message) window.alert(r.data.message);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const supprimer = async (s: SessionSoutenance) => {
    if (!window.confirm(`Supprimer la session « ${s.nom} » ?`)) return;
    try {
      await SessionsApi.supprimer(s.id);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Sessions de soutenance</h1>
        {estAdministrateur && (
          <Bouton onClick={ouvrirCreation}><Plus size={16} /> Nouvelle session</Bouton>
        )}
      </div>

      <MessageErreur erreur={erreur} />

      <Carte>
        <Tableau entetes={['Nom', 'Période', 'Année', 'Statut', 'Contenu', 'Actions']}>
          {items.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-medium">{s.nom}</td>
              <td className="px-4 py-2.5 text-slate-600 text-sm">
                {formatDate(s.date_debut)} → {formatDate(s.date_fin)}
              </td>
              <td className="px-4 py-2.5">{s.annee_universitaire}</td>
              <td className="px-4 py-2.5">
                <Etiquette couleur={couleurStatut(s.statut)}>
                  {s.statut === 'ouverte' ? 'Ouverte' : s.statut === 'cloturee' ? 'Clôturée' : 'Planification'}
                </Etiquette>
              </td>
              <td className="px-4 py-2.5 text-xs text-slate-500">
                {s.soutenances_count ?? 0} soutenance(s) · {s.jurys_count ?? 0} jury(s)
              </td>
              <td className="px-4 py-2.5">
                {estAdministrateur && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.statut !== 'cloturee' && (
                      <>
                        <Bouton variante="secondaire" petit onClick={() => ouvrirModif(s)}><Pencil size={14} /></Bouton>
                        <Bouton variante="succes" petit onClick={() => transition(s, 'ouvrir')} desactive={s.statut === 'ouverte'}>
                          <Unlock size={14} /> Ouvrir
                        </Bouton>
                        <Bouton variante="accent" petit onClick={() => transition(s, 'cloturer')} desactive={s.statut !== 'ouverte'}>
                          <Lock size={14} /> Clôturer
                        </Bouton>
                      </>
                    )}
                    <Bouton variante="danger" petit onClick={() => supprimer(s)}><Trash2 size={14} /></Bouton>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Tableau>
      </Carte>

      <Modale
        ouvert={!!modale}
        onFermer={() => setModale(null)}
        titre={nouveau ? 'Nouvelle session' : 'Modifier la session'}
      >
        <div className="space-y-4">
          <MessageErreur erreur={erreur} />
          <Champ label="Nom" requis>
            <input className={champCss} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </Champ>
          <div className="grid grid-cols-2 gap-4">
            <Champ label="Date de début" requis>
              <input type="date" className={champCss} value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} />
            </Champ>
            <Champ label="Date de fin" requis>
              <input type="date" className={champCss} value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} />
            </Champ>
          </div>
          <Champ label="Année universitaire" requis>
            <input className={champCss} placeholder="2025-2026" value={form.annee_universitaire} onChange={(e) => setForm({ ...form, annee_universitaire: e.target.value })} />
          </Champ>
          <Champ label="Description">
            <textarea className={champCss} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Champ>
          <div className="flex justify-end gap-2">
            <Bouton variante="secondaire" onClick={() => setModale(null)}>Annuler</Bouton>
            <Bouton onClick={enregistrer}>Enregistrer</Bouton>
          </div>
        </div>
      </Modale>
    </div>
  );
}
