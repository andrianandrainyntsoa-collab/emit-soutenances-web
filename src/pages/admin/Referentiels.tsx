import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Formations, ParcoursApi, Promotions } from '../../api/endpoints';
import type { Formation, Parcours, Promotion } from '../../types';
import {
  Bouton,
  Carte,
  Champ,
  MessageErreur,
  Modale,
  Tableau,
  champCss,
  messageApiErreur,
} from '../../components/ui';

type Onglet = 'formations' | 'parcours' | 'promotions';

export default function Referentiels() {
  const [onglet, setOnglet] = useState<Onglet>('formations');
  const [formations, setFormations] = useState<Formation[]>([]);
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  // modales
  const [modaleFormation, setModaleFormation] = useState(false);
  const [modaleParcours, setModaleParcours] = useState(false);
  const [modalePromotion, setModalePromotion] = useState(false);

  const [f, setF] = useState({ code: '', nom: '', description: '' });
  const [p, setP] = useState({ formation_id: '', code: '', nom: '', description: '' });
  const [pr, setPr] = useState({ formation_id: '', parcours_id: '', nom: '', annee_universitaire: '' });

  const charger = () => {
    const tab = (d: any) => (Array.isArray(d) ? d : (d?.data ?? []));
    Formations.liste().then((r) => setFormations(tab(r.data))).catch(() => {});
    ParcoursApi.liste().then((r) => setParcours(tab(r.data))).catch(() => {});
    Promotions.liste().then((r) => setPromotions(tab(r.data))).catch(() => {});
  };

  useEffect(charger, []);

  const creerFormation = async () => {
    try {
      await Formations.creer({ ...f, active: true });
      setModaleFormation(false);
      setF({ code: '', nom: '', description: '' });
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const creerParcours = async () => {
    try {
      await ParcoursApi.creer({ ...p, active: true });
      setModaleParcours(false);
      setP({ formation_id: '', code: '', nom: '', description: '' });
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const creerPromotion = async () => {
    try {
      await Promotions.creer({
        parcours_id: pr.parcours_id,
        nom: pr.nom,
        annee_universitaire: pr.annee_universitaire,
      });
      setModalePromotion(false);
      setPr({ formation_id: '', parcours_id: '', nom: '', annee_universitaire: '' });
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  // Parcours filtrés par la formation (mention) sélectionnée :
  // chargés depuis le backend (relation réelle), jamais codés en dur.
  const parcoursFiltres = parcours.filter(
    (x) =>
      pr.formation_id !== '' &&
      (String((x as any).formation_id) === pr.formation_id ||
        String((x as any).formation?.id) === pr.formation_id)
  );

  const supprimer = async (type: string, id: number) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      if (type === 'formation') await Formations.supprimer(id);
      if (type === 'parcours') await ParcoursApi.supprimer(id);
      if (type === 'promotion') await Promotions.supprimer(id);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const onglets: { cle: Onglet; libelle: string }[] = [
    { cle: 'formations', libelle: 'Formations' },
    { cle: 'parcours', libelle: 'Parcours' },
    { cle: 'promotions', libelle: 'Promotions' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Référentiels académiques</h1>
        <Bouton
          onClick={() =>
            onglet === 'formations'
              ? setModaleFormation(true)
              : onglet === 'parcours'
                ? setModaleParcours(true)
                : setModalePromotion(true)
          }
        >
          <Plus size={16} /> Ajouter
        </Bouton>
      </div>

      <MessageErreur erreur={erreur} />

      <div className="flex gap-1 bg-slate-200 rounded-lg p-1 w-fit">
        {onglets.map((o) => (
          <button
            key={o.cle}
            onClick={() => setOnglet(o.cle)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              onglet === o.cle ? 'bg-white shadow text-primaire-800' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {o.libelle}
          </button>
        ))}
      </div>

      {onglet === 'formations' && (
        <Carte titre="Formations">
          <Tableau entetes={['Code', 'Nom', 'Description', '']}>
            {formations.map((fo) => (
              <tr key={fo.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs">{fo.code}</td>
                <td className="px-4 py-2.5 font-medium">{fo.nom}</td>
                <td className="px-4 py-2.5 text-slate-500 text-sm">{fo.description ?? '—'}</td>
                <td className="px-4 py-2.5 text-right">
                  <Bouton variante="danger" petit onClick={() => supprimer('formation', fo.id)}><Trash2 size={14} /></Bouton>
                </td>
              </tr>
            ))}
          </Tableau>
        </Carte>
      )}

      {onglet === 'parcours' && (
        <Carte titre="Parcours">
          <Tableau entetes={['Code', 'Nom', 'Formation', '']}>
            {parcours.map((pa) => (
              <tr key={pa.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs">{pa.code}</td>
                <td className="px-4 py-2.5 font-medium">{pa.nom}</td>
                <td className="px-4 py-2.5 text-slate-500">{pa.formation?.nom ?? '—'}</td>
                <td className="px-4 py-2.5 text-right">
                  <Bouton variante="danger" petit onClick={() => supprimer('parcours', pa.id)}><Trash2 size={14} /></Bouton>
                </td>
              </tr>
            ))}
          </Tableau>
        </Carte>
      )}

      {onglet === 'promotions' && (
        <Carte titre="Promotions">
          <Tableau entetes={['Nom', 'Année universitaire', 'Formation', 'Parcours', '']}>
            {promotions.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium">{po.nom}</td>
                <td className="px-4 py-2.5">{po.annee_universitaire}</td>
                <td className="px-4 py-2.5 text-slate-500">{po.formation?.nom ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-500">{po.parcours?.nom ?? '—'}</td>
                <td className="px-4 py-2.5 text-right">
                  <Bouton variante="danger" petit onClick={() => supprimer('promotion', po.id)}><Trash2 size={14} /></Bouton>
                </td>
              </tr>
            ))}
          </Tableau>
        </Carte>
      )}

      {/* Modale formation */}
      <Modale ouvert={modaleFormation} onFermer={() => setModaleFormation(false)} titre="Nouvelle formation">
        <div className="space-y-4">
          <Champ label="Code" requis>
            <input className={champCss} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
          </Champ>
          <Champ label="Nom" requis>
            <input className={champCss} value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />
          </Champ>
          <Champ label="Description">
            <textarea className={champCss} rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Champ>
          <div className="flex justify-end gap-2">
            <Bouton variante="secondaire" onClick={() => setModaleFormation(false)}>Annuler</Bouton>
            <Bouton onClick={creerFormation}>Créer</Bouton>
          </div>
        </div>
      </Modale>

      {/* Modale parcours */}
      <Modale ouvert={modaleParcours} onFermer={() => setModaleParcours(false)} titre="Nouveau parcours">
        <div className="space-y-4">
          <Champ label="Formation" requis>
            <select className={champCss} value={p.formation_id} onChange={(e) => setP({ ...p, formation_id: e.target.value })}>
              <option value="">— Choisir —</option>
              {formations.map((fo) => <option key={fo.id} value={fo.id}>{fo.nom}</option>)}
            </select>
          </Champ>
          <div className="grid grid-cols-2 gap-4">
            <Champ label="Code" requis>
              <input className={champCss} value={p.code} onChange={(e) => setP({ ...p, code: e.target.value })} />
            </Champ>
            <Champ label="Nom" requis>
              <input className={champCss} value={p.nom} onChange={(e) => setP({ ...p, nom: e.target.value })} />
            </Champ>
          </div>
          <div className="flex justify-end gap-2">
            <Bouton variante="secondaire" onClick={() => setModaleParcours(false)}>Annuler</Bouton>
            <Bouton onClick={creerParcours}>Créer</Bouton>
          </div>
        </div>
      </Modale>

      {/* Modale promotion */}
      <Modale ouvert={modalePromotion} onFermer={() => setModalePromotion(false)} titre="Nouvelle promotion">
        <div className="space-y-4">
          <Champ label="Formation (mention)" requis>
            <select
              className={champCss}
              value={pr.formation_id}
              onChange={(e) => setPr({ ...pr, formation_id: e.target.value, parcours_id: '' })}
            >
              <option value="">— Choisir —</option>
              {formations.map((fo) => <option key={fo.id} value={fo.id}>{fo.nom} ({fo.code})</option>)}
            </select>
          </Champ>
          <Champ label="Parcours" requis>
            <select
              className={champCss}
              value={pr.parcours_id}
              onChange={(e) => setPr({ ...pr, parcours_id: e.target.value })}
              disabled={pr.formation_id === ''}
            >
              <option value="">
                {pr.formation_id === '' ? '— Choisir d\'abord une formation —' : '— Choisir —'}
              </option>
              {parcoursFiltres.map((pa) => (
                <option key={pa.id} value={pa.id}>{pa.nom} ({pa.code})</option>
              ))}
            </select>
          </Champ>
          {pr.formation_id !== '' && parcoursFiltres.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Aucun parcours n'est rattaché à cette formation. Créez d'abord un parcours dans
              l'onglet « Parcours ».
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Champ label="Nom (ex : Master 2 SDIA)" requis>
              <input className={champCss} value={pr.nom} onChange={(e) => setPr({ ...pr, nom: e.target.value })} />
            </Champ>
            <Champ label="Année universitaire (ex : 2025-2026)" requis>
              <input className={champCss} value={pr.annee_universitaire} onChange={(e) => setPr({ ...pr, annee_universitaire: e.target.value })} />
            </Champ>
          </div>
          <div className="flex justify-end gap-2">
            <Bouton variante="secondaire" onClick={() => setModalePromotion(false)}>Annuler</Bouton>
            <Bouton
              onClick={creerPromotion}
              desactive={!pr.formation_id || !pr.parcours_id || !pr.nom || !pr.annee_universitaire}
            >
              Créer
            </Bouton>
          </div>
        </div>
      </Modale>
    </div>
  );
}
