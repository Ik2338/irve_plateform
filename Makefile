.PHONY: up down logs reset seed

up:
	cp -n .env.example .env || true
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

reset:
	docker compose down -v
	docker compose up -d --build

seed:
	docker compose exec backend npx prisma db seed

migrate:
	docker compose exec backend npx prisma migrate deploy

studio:
	docker compose exec backend npx prisma studio

bash-backend:
	docker compose exec backend sh

bash-db:
	docker compose exec postgres psql -U irve -d irvedb

dev-tools:
	docker compose --profile dev-tools up -d adminer


<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- OBJETS / ACTEURS                                        -->
    <!-- ═══════════════════════════════════════════════════════ -->

    <!-- Installateur (acteur) -->
    <mxCell id="10" value="Installateur" style="shape=mxgraph.uml.actor;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=12;" vertex="1" parent="1">
      <mxGeometry x="100" y="80" width="60" height="80" as="geometry" />
    </mxCell>

    <!-- :DevisHandler -->
    <mxCell id="20" value=":DevisHandler" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=12;arcSize=15;" vertex="1" parent="1">
      <mxGeometry x="500" y="80" width="180" height="60" as="geometry" />
    </mxCell>

    <!-- demande : DemandeInstallation -->
    <mxCell id="30" value="demande : DemandeInstallation" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;arcSize=15;" vertex="1" parent="1">
      <mxGeometry x="160" y="300" width="220" height="60" as="geometry" />
    </mxCell>

    <!-- nouveauDevis : Devis -->
    <mxCell id="40" value="nouveauDevis : Devis" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;arcSize=15;" vertex="1" parent="1">
      <mxGeometry x="880" y="80" width="180" height="60" as="geometry" />
    </mxCell>

    <!-- :Devis (collection) -->
    <mxCell id="50" value=":Devis" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;arcSize=15;" vertex="1" parent="1">
      <mxGeometry x="880" y="300" width="180" height="60" as="geometry" />
    </mxCell>

    <!-- conversation : Conversation -->
    <mxCell id="60" value="conversation : Conversation" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;arcSize=15;" vertex="1" parent="1">
      <mxGeometry x="500" y="480" width="200" height="60" as="geometry" />
    </mxCell>

    <!-- notif : Notification -->
    <mxCell id="70" value="notif : Notification" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;arcSize=15;" vertex="1" parent="1">
      <mxGeometry x="880" y="480" width="180" height="60" as="geometry" />
    </mxCell>

    <!-- client : Client (pour email) -->
    <mxCell id="80" value="client : Client" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;arcSize=15;" vertex="1" parent="1">
      <mxGeometry x="160" y="480" width="160" height="60" as="geometry" />
    </mxCell>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- LIENS DE BASE (traits non orientés entre objets)        -->
    <!-- ═══════════════════════════════════════════════════════ -->

    <!-- Installateur ↔ :DevisHandler -->
    <mxCell id="100" style="edgeStyle=none;html=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;" edge="1" source="10" target="20" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- :DevisHandler ↔ demande : DemandeInstallation -->
    <mxCell id="101" style="edgeStyle=none;html=1;" edge="1" source="20" target="30" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- :DevisHandler ↔ nouveauDevis : Devis -->
    <mxCell id="102" style="edgeStyle=none;html=1;" edge="1" source="20" target="40" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- :DevisHandler ↔ :Devis -->
    <mxCell id="103" style="edgeStyle=none;html=1;" edge="1" source="20" target="50" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- :DevisHandler ↔ conversation : Conversation -->
    <mxCell id="104" style="edgeStyle=none;html=1;" edge="1" source="20" target="60" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- :DevisHandler ↔ notif : Notification -->
    <mxCell id="105" style="edgeStyle=none;html=1;" edge="1" source="20" target="70" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- :DevisHandler ↔ client : Client -->
    <mxCell id="106" style="edgeStyle=none;html=1;" edge="1" source="20" target="80" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MESSAGES NUMÉROTÉS                                      -->
    <!-- ═══════════════════════════════════════════════════════ -->

    <!-- 1 : soumettre Devis(montant, taux, notes) -->
    <mxCell id="200" value="1 : soumettre Devis(montant, taux, notes)" style="edgeStyle=orthogonalEdgeStyle;html=1;exitX=1;exitY=0.3;exitDx=0;exitDy=0;entryX=0;entryY=0.3;entryDx=0;entryDy=0;endArrow=open;endFill=0;strokeColor=#6c8ebf;fontStyle=1;fontSize=10;" edge="1" source="10" target="20" parent="1">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="160" y="96" />
          <mxPoint x="500" y="96" />
        </Array>
      </mxGeometry>
    </mxCell>

    <!-- 1.1 : demande = trouver(numDemande) -->
    <mxCell id="201" value="1.1 : demande = trouver(numDemande)" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;strokeColor=#d6b656;fontStyle=0;fontSize=10;" edge="1" source="20" target="30" parent="1">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="500" y="330" />
          <mxPoint x="380" y="330" />
        </Array>
      </mxGeometry>
    </mxCell>

    <!-- 1.2 : verifierStatut() — boucle sur DevisHandler -->
    <mxCell id="202" value="1.2 : verifierStatut()" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;strokeColor=#82b366;fontStyle=0;fontSize=10;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" source="20" target="20" parent="1">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="590" y="30" />
          <mxPoint x="590" y="80" />
        </Array>
      </mxGeometry>
    </mxCell>


<!-- 2 : [statut != QUOTE_ACCEPTED] nouveauDevis = «create»(montant, taux, notes) -->
    <mxCell id="204" value="2 : [statut != ACCEPTED] nouveauDevis = «create»(montant, taux, notes)" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;strokeColor=#82b366;fontStyle=1;fontSize=10;" edge="1" source="20" target="40" parent="1">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="680" y="110" />
          <mxPoint x="880" y="110" />
        </Array>
      </mxGeometry>
    </mxCell>

    <!-- 2.1 : ajouterDevis(nouveauDevis) -->
    <mxCell id="205" value="2.1 : ajouterDevis(nouveauDevis)" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;strokeColor=#d6b656;fontStyle=0;fontSize=10;" edge="1" source="20" target="50" parent="1">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="680" y="330" />
          <mxPoint x="880" y="330" />
        </Array>
      </mxGeometry>
    </mxCell>

    <!-- 1.3 : modifierStatut(QUOTE_SENT) -->
    <mxCell id="206" value="1.3 : modifierStatut(QUOTE_SENT)" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;strokeColor=#82b366;fontStyle=0;fontSize=10;" edge="1" source="20" target="30" parent="1">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="500" y="360" />
          <mxPoint x="380" y="360" />
        </Array>
      </mxGeometry>
    </mxCell>

    <!-- 2.2 : conversation = ensureConversation(clientId, installerId, requestId) -->
    <mxCell id="207" value="2.2 : conversation = ensureConversation(clientId, installerId, requestId)" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;strokeColor=#9673a6;fontStyle=0;fontSize=9;" edge="1" source="20" target="60" parent="1">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="590" y="480" />
        </Array>
      </mxGeometry>
    </mxCell>

    <!-- 2.3 : notif = «create»(userId, type:NEW_QUOTE, title, body, link) -->
    <mxCell id="208" value="2.3 : notif = «create»(userId, type:NEW_QUOTE, title, body, link)" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;strokeColor=#b85450;fontStyle=0;fontSize=9;" edge="1" source="20" target="70" parent="1">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="680" y="510" />
          <mxPoint x="880" y="510" />
        </Array>
      </mxGeometry>
    </mxCell>

    <!-- 2.4 : client = findUnique(userId) [pour email] -->
    <mxCell id="209" value="2.4 : client = findUnique(userId)" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;strokeColor=#b85450;fontStyle=0;fontSize=9;" edge="1" source="20" target="80" parent="1">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="500" y="510" />
          <mxPoint x="320" y="510" />
        </Array>
      </mxGeometry>
    </mxCell>


  </root>
</mxGraphModel>