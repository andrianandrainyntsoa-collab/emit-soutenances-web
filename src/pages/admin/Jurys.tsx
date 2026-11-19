import { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Trash2, XCircle } from 'lucide-react';
import { Enseignants, Jurys, Sessions } from '../../api/endpoints';
import type { Enseignant, Jury, MembreJury, SessionSoutenance } from '../../types';
import {
  Bouton,
  Carte,
  Champ,
  Etiquette,
  MessageErreur,
  Modale,
  Tableau,
  champCss,
  messageApiErreur,
} from '../../components/ui';

export default function JurysPage() {
  const [jurys, setJurys] = useState<Jury[]>([]);
  const [sessions, setSessions] = useState<SessionSoutenance[]>([]);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const [modaleCreation, setModaleCreation] = useState(false);
  const [formCreation, setFormCreation] = useState({ session_id: '', code: '', nom: '' });

  const [detail, setDetail] = useState<Jury | null>(null);
  const [composition, setComposition] = useState<boolean>(false);
  const [formMembre, setFormMembre] = useState({ enseignant_id: '', fonction: '' });

  const charger = () => {
    Jurys.liste().then((r) => setJurys(r.data)).catch((e) => setErreur(messageApiErreur(e)));
    Sessions.liste().then((r) => setSessions(r.data)).catch(() => {});
    Enseignants.liste({ per_page: 100 }).then((r) => setEnseignants(r.data.data)).catch(() => {});
  };

  useEffect(charger, []);

  const ouvrirDetail = (j: Jury) => {
    setDetail(null);
    Jurys.voir(j.id).then((r) => {
      setDetail(r.data.jury);
      setComposition(r.data.composition_complete);
    });
  };

  const creerJury = async () => {
    try {
      await Jurys.creer({
        session_id: formCreation.session_id,
        code: formCreation.code || undefined,
        nom: formCreation.nom || undefined,
      });
      setModaleCreation(false);
      setFormCreation({ session_id: '', code: '', nom: '' });
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const ajouterMembre = async () => {
    if (!detail) return;
    try {
      await Jurys.ajouterMembre(detail.id, {
        enseignant_id: Number(formMembre.enseignant_id),
        fonction: formMembre.fonction,
      });
      setFormMembre({ enseignant_id: '', fonction: '' });
      ouvrirDetail({ id: detail.id } as Jury);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const retirerMembre = async (membreId: number) => {
    if (!detail) return;
    if (!window.confirm('Retirer ce membre du jury ?')) return;
    try {
      await Jurys.retirerMembre(detail.id, membreId);
      ouvrirDetail({ id: detail.id } as Jury);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const supprimerJury = async (j: Jury) => {
    if (!window.confirm(`Supprimer le jury « ${j.nom ?? j.code} » ?`)) return;
    try {
      await Jurys.supprimer(j.id);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const couleurFonction = (f: string) =>
    f === 'president' ? 'rouge' : f === 'rapporteur' ? 'bleu' : 'vert';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Jurys</h1>
        <Bouton onClick={() => setModaleCreation(true)}><Plus size={16} /> Nouveau jury</Bouton>
      </div>

      <MessageErreur erreur={erreur} />

      <Carte>
        <Tableau
          entetes={['Nom du groupe', 'Session', 'Composition', 'Soutenances', 'Actions']}
          vide={jurys.length === 0}
        >
          {jurys.map((j) => {
            const membres: MembreJury[] = j.membresJury ?? (j as any).membres_jury ?? [];
            return (
              <tr key={j.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{j.nom ?? j.code}</div>
                  {j.nom && <div className="text-xs text-slate-400 font-mono">{j.code}</div>}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-sm">{j.session?.nom ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {membres.length === 0 && <span className="text-slate-400 text-sm">Vide</span>}
                    {membres.map((m) => (
                      <Etiquette key={m.id} couleur={couleurFonction(m.fonction)}>
                        {m.enseignant?.user?.name?.split(' ')[0]} · {m.fonction}
                      </Etiquette>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">{j.soutenances_count ?? 0}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <Bouton variante="primaire" petit onClick={() => ouvrirDetail(j)}>Composer</Bouton>
                    <Bouton variante="danger" petit onClick={() => supprimerJury(j)}><Trash2 size={14} /></Bouton>
                  </div>
                </td>
              </tr>
            );
          })}
        </Tableau>
      </Carte>

      <Modale ouvert={modaleCreation} onFermer={() => setModaleCreation(false)} titre="Nouveau jury">
        <div className="space-y-4">
          <Champ label="Session" requis>
            <select className={champCss} value={formCreation.session_id} onChange={(e) => setFormCreation({ ...formCreation, session_id: e.target.value })}>
              <option value="">— Choisir —</option>
              {sessions.filter((s) => s.statut !== 'cloturee').map((s) => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </Champ>
          <div className="grid grid-cols-2 gap-4">
            <Champ label="Nom du groupe" requis>
              <input className={champCss} value={formCreation.nom} onChange={(e) => setFormCreation({ ...formCreation, nom: e.target.value })} placeholder="ex : Jury SDIA — Groupe A" />
            </Champ>
            <Champ label="Code (interne, auto si vide)">
              <input className={champCss} value={formCreation.code} onChange={(e) => setFormCreation({ ...formCreation, code: e.target.value })} />
            </Champ>
          </div>
          <p className="text-xs text-slate-400">
            Le nom du groupe est l'information affichée aux utilisateurs ; le code est un
            identifiant technique interne généré automatiquement.
          </p>
          <div className="flex justify-end gap-2">
            <Bouton variante="secondaire" onClick={() => setModaleCreation(false)} desactive={!formCreation.session_id || !formCreation.nom}>Annuler</Bouton>
            <Bouton onClick={creerJury} desactive={!formCreation.session_id || !formCreation.nom}>Créer</Bouton>
          </div>
        </div>
      </Modale>

      <Modale
        ouvert={!!detail}
        onFermer={() => setDetail(null)}
        titre={`Composition du jury — ${detail?.nom ?? detail?.code ?? ''}`}
        large
      >
        {detail && (
          <div className="space-y-4">
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              composition ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {composition ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {composition
                ? 'Composition complète : un Président, un Rapporteur, un Examinateur (RG03).'
                : 'Composition incomplète : ajoutez un Président, un Rapporteur et un Examinateur.'}
            </div>

            <Tableau entetes={['Enseignant', 'Fonction', '']} vide={(detail.membresJury ?? (detail as any).membres_jury ?? []).length === 0}>
              {((detail.membresJury ?? (detail as any).membres_jury ?? []) as MembreJury[]).map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">{m.enseignant?.user?.name}</td>
                  <td className="px-4 py-2.5">
                    <Etiquette couleur={couleurFonction(m.fonction)}>
                      {m.fonction.charAt(0).toUpperCase() + m.fonction.slice(1)}
                    </Etiquette>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Bouton variante="danger" petit onClick={() => retirerMembre(m.id)}><Trash2 size={14} /></Bouton>
                  </td>
                </tr>
              ))}
            </Tableau>

            <div className="border-t pt-4">
              <div className="font-medium text-sm mb-2">Ajouter un membre</div>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-48">
                  <Champ label="Enseignant" requis>
                    <select className={champCss} value={formMembre.enseignant_id} onChange={(e) => setFormMembre({ ...formMembre, enseignant_id: e.target.value })}>
                      <option value="">— Choisir —</option>
                      {enseignants.map((en) => (
                        <option key={en.id} value={en.id}>{en.user?.name} ({en.specialite ?? '—'})</option>
                      ))}
                    </select>
                  </Champ>
                </div>
                <div className="w-40">
                  <Champ label="Fonction" requis>
                    <select className={champCss} value={formMembre.fonction} onChange={(e) => setFormMembre({ ...formMembre, fonction: e.target.value })}>
                      <option value="">— Choisir —</option>
                      <option value="president">Président</option>
                      <option value="rapporteur">Rapporteur</option>
                      <option value="examinateur">Examinateur</option>
                    </select>
                  </Champ>
                </div>
                <Bouton onClick={ajouterMembre} desactive={!formMembre.enseignant_id || !formMembre.fonction}>
                  <Plus size={15} /> Ajouter
                </Bouton>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Règles : un seul Président et un seul Rapporteur par jury ; un enseignant ne peut pas
                être deux fois dans le même jury.
              </p>
            </div>
          </div>
        )}
      </Modale>
    </div>
  );
}
