# Logos attendus — public/logos/

Chaque logo doit être déposé sous la forme `{slug}.png` (priorité) ou `{slug}.svg` (fallback).  
`BrandLogo.tsx` essaie PNG → SVG → initiales. Le champ `logo_url` en DB prime sur tout.

Total : **55 fichiers**

## Voiture (32)
- alfa-romeo
- audi
- bmw
- chevrolet
- citroen
- cupra
- dacia
- fiat
- ford
- honda
- hyundai
- jaguar
- jeep
- kia
- land-rover
- lexus
- mazda
- mercedes-benz
- mini
- mitsubishi
- nissan
- opel
- peugeot
- porsche
- renault
- seat
- skoda
- subaru
- suzuki
- toyota
- volkswagen
- volvo

## Camion (5)
- daf
- iveco
- man
- renault-trucks
- scania

## Agricole (5)
- case-ih
- claas
- john-deere
- massey-ferguson
- new-holland

## Moto (5)
- ducati
- harley-davidson
- kawasaki
- ktm
- yamaha

## Travaux publics (3)
- caterpillar
- jcb
- komatsu

## Marine (2)
- sea-doo
- yamaha-marine

## Quad (2)
- can-am
- polaris

## Bus (1)
- mercedes-citaro

---

> **Exclus** : `tesla` (hors-sujet marché algérien), `setra` (logo indisponible).  
> Pour ajouter un logo, déposez le fichier et relancez `npm run check-logos`.
