# Calculateur IV pour pharmacie

Première version statique : HTML, CSS, JavaScript, pdf-lib et PDF.js inclus localement. Aucun service externe pour les calculs, aucune sauvegarde automatique, aucun renseignement nominatif patient demandé. Les saisies restent en mémoire jusqu'à fermeture ou réinitialisation de la page. Les PDF téléchargés et résumés copiés demeurent sous la responsabilité de l'utilisateur.

## Utilisation

Ouvrir le site hébergé. Choisir l'assurance puis saisir les montants observés dans RxPro. Les résultats sont automatiquement arrondis au cent le plus proche selon la règle confirmée par la pharmacie (4,546 $ devient 4,55 $). RAMQ désactive les étapes 2 et 3.

Le PDF source est préservé octet pour octet sous `dist/formulaire-officiel.pdf`. Le PDF généré superpose des informations sur la première page, remplit ses deux exemplaires et inclut automatiquement la procédure en deuxième page. Le profit est calculé automatiquement : prix à facturer au client arrondi moins coûtant de la prescription, puis reporté sur les deux exemplaires. Pour Uniprix Blanchette avec RAMQ, le profit correspond au total réel de la Rx (papier bleu) moins le coûtant. Pour les autres types de commande RAMQ, le profit reste non applicable. Les résultats calculables sont reportés automatiquement. Un F6 négatif ou un montant invalide bloque la génération.

Prévisualiser affiche le vrai PDF rempli. Télécharger produit un fichier local. Imprimer rend les pages du vrai PDF rempli à 300 ppp, puis déclenche l'impression du navigateur; si celui-ci bloque l'impression intégrée, télécharger le PDF puis utiliser son menu Imprimer. Le bouton Imprimer prépare deux pages A4, avec les procédures en deuxième page. Choisir le recto verso sur le bord long dans la boîte d’impression.

## Validation obligatoire avant utilisation réelle

- Paliers avec cents confirmés par la pharmacie : de 0 à 500,99 $ (÷ 0,65), de 501 à 750,99 $ (÷ 0,70), puis 751 $ et plus (÷ 0,72).
- Arrondi confirmé : au cent le plus proche (demi-cent vers le haut), puis F6 à partir du prix arrondi.
- Blanchette : la pharmacie a confirmé la même charte que pour l’antibiotique. Le NaCl et l’héparine sont calculés séparément : coûtant ÷ 0,65 jusqu’à 500,99 $, ÷ 0,70 de 501 à 750,99 $, ÷ 0,72 à partir de 751 $. Les limites avec cents sont confirmées. La ligne « Marge % » du PDF reçoit le taux de division 65, 70 ou 72; ce taux n’est pas un pourcentage de profit.
- Profit confirmé : prix à facturer au client − coûtant de la prescription. FE, FT et NET PATIENT ne changent pas cette formule.
- Confirmer l'acceptation administrative du remplissage numérique compte tenu de la mention « aucune copie modifiée ne sera acceptée ».
- Effectuer un essai physique d'impression sur Windows et Samsung. L'émulation de petit écran ne remplace pas un appareil réel.
- Les cases de contrôle ne remplacent jamais la validation du pharmacien ni la procédure originale.

## Hébergement autonome

Publier le contenu de `dist/` à la racine de GitHub Pages ou de tout hébergement statique HTTPS. Aucun serveur applicatif, abonnement ou connexion utilisateur n'est requis par le code. L'hébergement Sites utilise ses propres contrôles d'accès privés par défaut.

Pour une prévisualisation locale, servir `dist/` avec un serveur HTTP statique. Ne pas ouvrir directement le fichier HTML via `file://` : les modules JavaScript et le PDF nécessitent HTTP.

## Vérifications

`node --test tests.mjs` : parsing monétaire, paliers et intervalles, F6, RAMQ, FE/FT et charte automatique Blanchette. Calculs en cents; arithmétique entière pour les prix, pour tous les produits.

Contrôles effectués : essais du formulaire en navigateur, copie du résumé, génération/téléchargement PDF, aperçu PDF.js, inspection visuelle des deux exemplaires et format 612 × 792 points. Compatibilité matérielle Samsung et sortie physique imprimante à confirmer sur place.

Bibliothèques et licences dans `dist/vendor/`.

## Interface Labo PJC019

Identité visuelle adaptée des styles publics de https://portail-commande.web.app/ : palette bleu nuit, bleu et rouge, icône du portail, cartes arrondies et navigation repliable. Thèmes automatique, clair et sombre. Seules les préférences visuelles (thème et largeur du menu) sont mémorisées localement; les saisies de facturation ne sont pas enregistrées.

La liste affichée des règles à faire valider ne contient que les points encore en attente. Les paliers, l’arrondi et la charte Blanchette ont été retirés après confirmation. La ligne d’acceptation administrative disparaît lorsque sa case de validation est cochée pour le calcul en cours.

Rinçage et anticoagulant : un seul choix par groupe, pour Uniprix Blanchette, où les choix restent facultatifs. Pour Gentes et Tanguay et Autre, les sections sont masquées. Le PDF reçoit « N/A avec cette préparation » pour les deux sections après confirmation. Les champs d’approvisionnement et leurs lignes du résumé sont retirés. Les produits restent reportés dans les cases correspondantes des deux exemplaires du PDF.

Les choix NaCl pharmacie préparatrice et Héparine pharmacie préparatrice activent automatiquement les calculs Blanchette correspondants. Décocher le choix ou sélectionner un autre produit du même groupe désactive le calcul associé, sans effacer son coûtant saisi. Les deux groupes restent indépendants.
