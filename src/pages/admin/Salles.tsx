import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { Salles, DispoSalle } from '../../api/endpoints';
import type { DisponibiliteSalle, Salle } from '../../types';
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
  formatHeure,
  messageApiErreur,
} from '../../components/ui';

const VIDE = {
  code: '',
  nom: '',
  capacite: 20,
  batiment: '',
  etage: '',
  localisation: '',
  disponible: true,
};

export default function SallesPage() {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [dispos, setDispos] = useState<DisponibiliteSalle[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modale, setModale] = useState<Salle | null>(null);
  const [form, setForm] = useState({ ...VIDE });
  const [nouveau, setNouveau] = useState(true);

  // Modale disponibilité
  const [modaleDispo, setModaleDispo] = useState(false);
  const [dispo, setDispo] = useState({ salle_id: '', date_disponible: '', heure_debut: '', heure_fin: '' });

  const charger = () => {
    Salles.liste().then((r) => setSalles(r.data)).catch((e) => setErreur(messageApiErreur(e)));
    DispoSalle.liste().then((r) => setDispos(r.data)).catch(() => {});
  };

  useEffect(charger, []);

  const ouvrirCreation = () => {
    setForm({ ...VIDE });
    setNouveau(true);
    setModale({} as Salle);
  };

  const ouvrirModif = (s: Salle) => {
    setForm({
      code: s.code,
      nom: s.nom,
      capacite: s.capacite,
      batiment: s.batiment ?? '',
      etage: s.etage != null ? String(s.etage) : '',
      localisation: s.localisation ?? '',
      disponible: s.disponible,
    });
    setNouveau(false);
    setModale(s);
  };

  const enregistrer = async () => {
    if (!modale) return;
    setErreur(null);
    try {
      const donnees = {
        ...form,
        capacite: Number(form.capacite),
        etage: form.etage === '' ? null : Number(form.etage),
      };
      if (nouveau) await Salles.creer(donnees);
      else await Salles.maj(modale.id, donnees);
      setModale(null);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const supprimer = async (s: Salle) => {
    if (!window.confirm(`Supprimer la salle « ${s.code} » ?`)) return;
    try {
      await Salles.supprimer(s.id);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const ajouterDispo = async () => {
    try {
      await DispoSalle.creer(dispo);
      setModaleDispo(false);
      setDispo({ salle_id: '', date_disponible: '', heure_debut: '', heure_fin: '' });
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const supprimerDispo = async (id: number) => {
    if (!window.confirm('Supprimer cette disponibilité ?')) return;
    await DispoSalle.supprimer(id).catch(() => {});
    charger();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Salles & disponibilités</h1>
        <div className="flex gap-2">
          <Bouton variante="secondaire" onClick={() => setModaleDispo(true)}><Clock size={16} /> Disponibilité</Bouton>
          <Bouton onClick={ouvrirCreation}><Plus size={16} /> Nouvelle salle</Bouton>
        </div>
      </div>

      <MessageErreur erreur={erreur} />

      <Carte titre="Salles">
        <Tableau entetes={['Code', 'Nom', 'Capacité', 'Localisation', 'Disponible', 'Actions']}>
          {salles.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-mono text-xs font-semibold">{s.code}</td>
              <td className="px-4 py-2.5">{s.nom}</td>
              <td className="px-4 py-2.5">{s.capacite} places</td>
              <td className="px-4 py-2.5 text-slate-500 text-sm">
                {[s.batiment, s.etage != null ? `${s.etage}e étage` : null, s.localisation].filter(Boolean).join(' — ') || '—'}
              </td>
              <td className="px-4 py-2.5">
                {s.disponible ? <Etiquette couleur="vert">Oui</Etiquette> : <Etiquette couleur="rouge">Non</Etiquette>}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex gap-1.5">
                  <Bouton variante="secondaire" petit onClick={() => ouvrirModif(s)}><Pencil size={14} /></Bouton>
                  <Bouton variante="danger" petit onClick={() => supprimer(s)}><Trash2 size={14} /></Bouton>
                </div>
              </td>
            </tr>
          ))}
        </Tableau>
      </Carte>

      <Carte titre="Disponibilités déclarées (plages d’ouverture des salles)">
        <Tableau entetes={['Salle', 'Date', 'De', 'À', '']} vide={dispos.length === 0}>
          {dispos.map((d) => (
            <tr key={d.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-medium">{d.salle?.code}</td>
              <td className="px-4 py-2.5">{formatDate(d.date_disponible)}</td>
              <td className="px-4 py-2.5">{formatHeure(d.heure_debut)}</td>
              <td className="px-4 py-2.5">{formatHeure(d.heure_fin)}</td>
              <td className="px-4 py-2.5 text-right">
                <Bouton variante="danger" petit onClick={() => supprimerDispo(d.id)}><Trash2 size={14} /></Bouton>
              </td>
            </tr>
          ))}
        </Tableau>
      </Carte>

      <Modale ouvert={!!modale} onFermer={() => setModale(null)} titre={nouveau ? 'Nouvelle salle' : 'Modifier la salle'}>
        <div className="space-y-4">
          <MessageErreur erreur={erreur} />
          <div className="grid grid-cols-2 gap-4">
            <Champ label="Code" requis>
              <input className={champCss} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </Champ>
            <Champ label="Nom" requis>
              <input className={champCss} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </Champ>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Champ label="Capacité" requis>
              <input type="number" min={1} className={champCss} value={form.capacite} onChange={(e) => setForm({ ...form, capacite: Number(e.target.value) })} />
            </Champ>
            <Champ label="Bâtiment">
              <input className={champCss} value={form.batiment} onChange={(e) => setForm({ ...form, batiment: e.target.value })} />
            </Champ>
            <Champ label="Étage">
              <input type="number" className={champCss} value={form.etage} onChange={(e) => setForm({ ...form, etage: e.target.value })} />
            </Champ>
          </div>
          <Champ label="Localisation">
            <input className={champCss} value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} />
          </Champ>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.disponible} onChange={(e) => setForm({ ...form, disponible: e.target.checked })} />
            Salle disponible pour les soutenances
          </label>
          <div className="flex justify-end gap-2">
            <Bouton variante="secondaire" onClick={() => setModale(null)}>Annuler</Bouton>
            <Bouton onClick={enregistrer}>Enregistrer</Bouton>
          </div>
        </div>
      </Modale>

      <Modale ouvert={modaleDispo} onFermer={() => setModaleDispo(false)} titre="Nouvelle disponibilité de salle">
        <div className="space-y-4">
          <Champ label="Salle" requis>
            <select className={champCss} value={dispo.salle_id} onChange={(e) => setDispo({ ...dispo, salle_id: e.target.value })}>
              <option value="">— Choisir —</option>
              {salles.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.nom}</option>)}
            </select>
          </Champ>
          <Champ label="Date" requis>
            <input type="date" className={champCss} value={dispo.date_disponible} onChange={(e) => setDispo({ ...dispo, date_disponible: e.target.value })} />
          </Champ>
          <div className="grid grid-cols-2 gap-4">
            <Champ label="Heure de début" requis>
              <input type="time" step={60} className={champCss} value={dispo.heure_debut} onChange={(e) => setDispo({ ...dispo, heure_debut: e.target.value })} />
            </Champ>
            <Champ label="Heure de fin" requis>
              <input type="time" step={60} className={champCss} value={dispo.heure_fin} onChange={(e) => setDispo({ ...dispo, heure_fin: e.target.value })} />
            </Champ>
          </div>
          <div className="flex justify-end gap-2">
            <Bouton variante="secondaire" onClick={() => setModaleDispo(false)}>Annuler</Bouton>
            <Bouton onClick={ajouterDispo}>Ajouter</Bouton>
          </div>
        </div>
      </Modale>
    </div>
  );
}
