# Fotolou PWA

Base Angular PWA pour Fotolou.

## Stack

- Angular 21
- Routing standalone
- SCSS
- Service worker Angular
- Manifest Web App
- Tests unitaires avec Vitest

## Structure

```text
src/
  app/
    features/
      admin/
      client/
      coiffeur/
```

Les dossiers `admin`, `client` et `coiffeur` sont volontairement vides.

## Commandes

```bash
npm start
```

Lance le serveur de developpement sur `http://localhost:4200/`.

```bash
npm run build
```

Genere le build de production dans `dist/`.

```bash
npm test -- --watch=false
```

Lance les tests une seule fois.
