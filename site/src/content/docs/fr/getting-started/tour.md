---
title: Visite en huit étapes
description: Le plugin en huit captures, du premier commentaire à la note d'extraction.
sidebar:
  order: 3
---

Les captures ci-dessous proviennent du coffre d'exemple [`demo-vault/`](https://github.com/Floernt/hypomnema/tree/main/demo-vault), dans le vrai Obsidian, avec le vrai plugin, en Aperçu en direct.

**1. Le texte, et la réflexion à côté.** Les passages commentés reçoivent une teinte légère et un soulignement de la couleur de leur catégorie. Le panneau « Commentaires », à droite, liste tous les commentaires dans l'ordre du texte, avec le passage cité, la date, la catégorie et les réponses. La note reste lisible : rien n'encombre les lignes, aucune note de bas de page à aller chercher.

![Vue d'ensemble : un article capturé, ses passages commentés en couleur et le panneau des commentaires](/screenshots/01-overview-fr.png)

**2. Rédiger sans masquer le texte.** On sélectionne une phrase et on lance la commande. La rédaction s'ouvre dans le panneau, à côté du passage, et non dans une fenêtre qui le recouvre. On choisit une catégorie, on écrit, puis Ctrl+Entrée.

![Rédaction d'un commentaire dans le panneau latéral, avec les pastilles de catégorie](/screenshots/02-compose-fr.png)

**3. Des métadonnées qui suivent la lecture.** Enregistrer un commentaire de la catégorie « Citation » a ajouté le tag `citation` aux propriétés de la note. La lecture apparaît désormais dans les recherches par tag, le volet des tags et les requêtes Dataview, sans étiquetage manuel. Si l'on supprime le dernier commentaire « Citation », le tag disparaît, sauf si on l'avait posé soi-même.

![Le tag citation ajouté automatiquement aux propriétés de la note](/screenshots/03-auto-tags-fr.png)

**4. Commenter un point, pas seulement un passage.** Sans sélection, le commentaire s'attache à la position du curseur et apparaît comme une petite bulle dans le texte. Un clic sur la bulle met son fil en avant dans le panneau, avec quelques mots de contexte autour.

![Un commentaire posé au curseur, affiché comme une bulle, et son fil mis en avant](/screenshots/04-point-comment-fr.png)

**5. Des commentaires cherchables dans tout le coffre.** « Diophante » ne figure que dans un commentaire, jamais dans l'article. La recherche ordinaire d'Obsidian retrouve pourtant la note, puisque les commentaires sont du texte brut qu'elle contient.

![Recherche dans le coffre retrouvant un mot présent uniquement dans un commentaire](/screenshots/05-search-fr.png)

**6. Vos propres catégories.** Chaque catégorie associe un nom, une couleur et un tag : « Idée », « Question », « À vérifier », « Citation », ou ce qui convient à votre manière de lire.

![Réglages des catégories : nom, couleur et tag](/screenshots/06-settings-fr.png)

Les étapes 7 et 8 sont facultatives. Ni l'une ni l'autre ne s'active tant qu'on ne la met pas en marche, et aucune ne modifie la manière dont les commentaires sont stockés. Elles répondent à une même intention : un outil d'annotation doit aider à reprendre sa pensée, pas la garder à sa place. Écrire un commentaire, c'est confier une réflexion à la machine. Ces deux fonctions servent à la récupérer, à la relire, à la retravailler. L'idée est développée sous le nom de [« dépossession opératoire »](https://reflexions.florianernotte.be/post/depossession-operatoire/).

**7. Les commentaires en marge.** On active *Commentaires en marge* dans *Paramètres → Hypomnema*, ou la commande *Afficher ou masquer les commentaires en marge*. Chaque commentaire s'affiche alors à côté de son passage, comme une note au crayon dans la marge d'un livre, dans la couleur de sa catégorie. Le survol d'une note met son passage en évidence. Un clic ouvre le fil dans le panneau, où l'on continue de rédiger et de répondre. Le réglage *Contenu de la marge* affiche le commentaire seul ou le fil entier.

![La marge activée depuis la palette de commandes, puis l'ouverture d'un fil : les commentaires passent sous leur paragraphe](/screenshots/07-margin-fr.gif)

Quand la place manque pour une marge (panneau latéral ouvert, petit écran), chaque commentaire passe sous son paragraphe.

![Dans un panneau étroit, les commentaires s'affichent sous leur paragraphe](/screenshots/08-margin-narrow-fr.png)

*Pourquoi :* dans le panneau, les commentaires vivent dans un outil à côté du texte. En marge, on se relit en relisant la source, et le dialogue entre les deux reste sous les yeux.

**8. Extraire ses commentaires dans une note.** La commande *Extraire les commentaires de cette note*, ou un clic droit sur un dossier → *Extraire les commentaires de ce dossier*, recopie les commentaires dans une note à part. Trois formats sont proposés : une liste par catégorie, un tableau, ou un tableau Kanban avec une colonne par catégorie et une colonne *Fait*. Chaque commentaire se termine par un lien ↩ qui rouvre la note source et sélectionne le passage. Une nouvelle extraction n'ajoute que les commentaires écrits depuis : les cartes déplacées ou cochées restent où elles sont.

![Extraction depuis la palette de commandes : un tableau Kanban s'ouvre, et son lien ↩ ramène au passage](/screenshots/10-extract-fr.gif)

Le format, le dossier de destination, le nom de la note et le gabarit de ligne (`{{text}}`, `{{quote}}`, `{{category}}`, `{{date}}`, `{{note}}`, `{{link}}`…) se règlent dans *Paramètres → Hypomnema*.

![Réglages de l'extraction](/screenshots/09-extract-settings-fr.png)

La note d'extraction porte des propriétés (`hypomnema-extract`, `hypomnema-source`, `hypomnema-date`) que Dataview sait retrouver, et ses éléments sont des tâches ordinaires. Les [pages Intégrations](/fr/integrations/dataview/) proposent des requêtes prêtes à l'emploi, une méthode de relecture en Kanban et une macro QuickAdd.

![Un tableau de bord Dataview qui liste les notes d'extraction et tous les commentaires du coffre](/screenshots/11-dataview-dashboard-fr.png)

*Pourquoi :* un commentaire ne vaut que si l'on y revient. L'extraction transforme les annotations en matière à retravailler : on les trie, on en écarte, on en fait des tâches ou un texte. Sans cela, elles restent des traces stockées pour le compte de l'utilisateur.
