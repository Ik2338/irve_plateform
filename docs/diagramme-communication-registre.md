# Diagramme de communication UML - cas "Creer un compte"

Apres verification de la notation UML, un diagramme de communication doit montrer :

- les objets ou instances qui collaborent ;
- les liens entre ces objets ;
- les messages numerotes sur les liens ;
- l'ordre avec `1`, `1.1`, `1.2`, etc.

Le diagramme a donc ete refait au niveau analyse/RUP, comme dans l'exemple de la caisse, sans entrer dans les classes techniques du code (`AuthService`, `PrismaService`, `authApi`, etc.).

Fichier image :

- `docs/diagramme-communication-registre.svg`

## Objets du diagramme

- `:FormulaireInscription` : interface de saisie.
- `ci:ControleInscription` : objet de controle du cas d'utilisation.
- `q:QualificationQualifelec` : objet qui verifie le SIRET si l'utilisateur est installateur.
- `rq:RegistreQualifelec` : registre externe Qualifelec / API Entreprise.
- `u:Utilisateur` : compte utilisateur cree.
- `pi:ProfilInstallateur` : profil cree seulement si le role est installateur.
- `ev:EmailVerification` : email de verification du compte.
- `:PageVerificationEmail` : page affichee apres creation du compte.

## Messages

1. `demanderInscription(donnees)`
1.1. `inscrire(donnees)`
1.1.1. `[role=INSTALLER] verifierSiret(siret)`
1.1.1.1. `chercherCertificat(siret)`
1.1.1.2. `retournerQualification(certificat, indices)`
1.2. `creerCompte(nom, prenom, email, motDePasse, telephone, role)`
1.3. `[role=INSTALLER] creerProfil(siret, certificat, indices)`
1.4. `creerEmailVerification(email)`
1.5. `envoyerLienVerification(email)`
1.6. `afficherConfirmation()`
1.7. `redirigerVersVerificationEmail()`

## Regles metier representees

- Si le role est `CLIENT`, les messages `1.1.1`, `1.1.1.1`, `1.1.1.2` et `1.3` ne sont pas executes.
- Si le role est `INSTALLER`, le SIRET doit etre valide dans le registre Qualifelec avant la creation du compte.
- Si l'email existe deja, le controle d'inscription refuse la creation du compte.
- Si le SIRET existe deja, le controle d'inscription refuse la creation du profil installateur.
