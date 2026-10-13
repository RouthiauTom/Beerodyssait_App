# Tester Beerodys’Sait sur GitHub Pages

Le dépôt distant configuré est `RouthiauTom/Beerodyssait_App`, branche `main`. Le workflow `.github/workflows/pages.yml` installe les dépendances, exécute les tests, compile puis publie uniquement `dist/`.

1. Sur GitHub, ouvrir le dépôt puis **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Dans le terminal de **Beerodyssait_App**, enregistrer et envoyer les fichiers :

```sh
git add .
git commit -m "Créer Beerodys’Sait et préparer GitHub Pages"
git push origin main
```

3. Attendre la réussite du workflow **Publier Beerodys’Sait sur GitHub Pages** dans l’onglet **Actions**.
4. Ouvrir l’adresse indiquée par le déploiement. Avec le nom de dépôt actuel et sans domaine personnalisé, l’adresse attendue est `https://routhiautom.github.io/Beerodyssait_App/`.

Le dépôt doit être public avec GitHub Free ; GitHub Pages pour un dépôt privé dépend de l’abonnement. Voir la [documentation GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Essai sur téléphone

- Ouvrir l’adresse HTTPS et attendre « Prêt à jouer hors ligne sur cet appareil. ».
- Créer une partie et vérifier le plateau, le zoom et une question dans chaque langue.
- Fermer puis rouvrir la page pour reprendre la partie.
- Activer le mode avion et recharger cette même adresse, ou le raccourci installé.
- Sur iPhone, l’installation se fait via Safari → Partager → Sur l’écran d’accueil ; sur Android, utiliser l’option d’installation du navigateur.

La sauvegarde de localhost ne se transfère pas sur GitHub Pages : chaque origine possède son stockage. Une mise à jour s’active après fermeture de tous les onglets du jeu.

Les chemins relatifs et le cache ont été testés sous un sous-chemin. Les outils locaux, dépendances et fichiers d’environnement sont exclus par `.gitignore`. Aucune publication n’a été réalisée lors de la préparation du workflow.
