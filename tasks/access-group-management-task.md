# Access Group Management Task

## Ziel

Die Anwendung erhält globale Zugriffsgruppen, über die Administratoren Benutzer organisatorisch zusammenfassen und für Toolbox-Module freischalten können.

Gruppen ergänzen das bestehende rollenbasierte Zugriffssystem. Sie ersetzen weder die Systemrollen noch deren technische Schutzregeln.

Der Zugriff auf ein Modul wird additiv ausgewertet:

```text
Modul ist aktiv
UND
(
    Benutzerrolle ist freigegeben
    ODER
    Benutzer gehört einer für das Modul freigegebenen aktiven Gruppe an
)
```

Verpflichtende Rollen aus dem technischen Modulkatalog bleiben immer wirksam.

Administrative Kernmodule bleiben ausschließlich für Administratoren erreichbar und können nicht über Gruppen für andere Benutzer freigegeben werden.

---

# Verbindliche fachliche Entscheidungen

## Globale Gruppen

Zugriffsgruppen sind global und können mehreren Benutzern sowie mehreren Modulen zugeordnet werden.

Eine Gruppe, die nur einem Modul zugeordnet ist, verhält sich dadurch faktisch wie eine modulspezifische Gruppe. Ein separater Gruppentyp für globale und modulspezifische Gruppen wird nicht eingeführt.

## Additives Berechtigungsmodell

Gruppen dürfen Zugriff gewähren, aber niemals explizit verweigern.

Es gibt keine Deny-Regeln und keine Prioritätsregeln zwischen Rollen und Gruppen.

Eine vorhandene Rollenfreigabe kann durch eine Gruppe nicht aufgehoben werden.

## Technischer Gruppenschlüssel

Jede Gruppe besitzt:

- eine interne UUID
- einen eindeutigen technischen Schlüssel
- einen Anzeigenamen
- eine optionale Beschreibung
- einen Archivierungszeitpunkt

Der technische Schlüssel:

- wird bei der Erstellung festgelegt
- wird normalisiert und in Kleinbuchstaben gespeichert
- darf nach der Erstellung nicht geändert werden
- besteht aus Kleinbuchstaben, Zahlen und Bindestrichen
- ist zwischen 3 und 64 Zeichen lang

Beispiele:

```text
org-leitung
security
mining
salvage-team
event-planung
```

## Archivierung

Eine archivierte Gruppe:

- bleibt in der Datenbank vorhanden
- behält bestehende Benutzerzuordnungen
- behält bestehende Modulzuordnungen
- gewährt keinen Modulzugriff
- kann keinem neuen Benutzer zugeordnet werden
- kann keinem neuen Modul zugeordnet werden
- kann wiederhergestellt werden

Beim Wiederherstellen werden die bestehenden Zuordnungen erneut wirksam.

Archivierung ist damit vollständig reversibel.

## Löschen

Eine Gruppe darf nur endgültig gelöscht werden, wenn sie:

- keinem Benutzer zugeordnet ist
- keinem Modul zugeordnet ist

Diese Regel wird sowohl durch die Geschäftslogik als auch durch Datenbankrelationen geschützt.

## Benutzerstatus

Neue Gruppenzuweisungen sind ausschließlich für Benutzer mit dem Status `ACTIVE` erlaubt.

Ändert sich der Benutzerstatus später, bleiben vorhandene Gruppenzuweisungen erhalten.

Insbesondere werden Gruppenzuweisungen bei Sperrung, Ablehnung oder Bann eines Benutzers nicht automatisch gelöscht.

Die bestehenden Authentifizierungs- und Statusregeln verhindern unabhängig davon den Zugriff gesperrter Benutzer.

## Administrative Kernmodule

Die folgenden Module bleiben technisch geschützt:

- Mitgliederverwaltung
- Modulverwaltung
- Zugriffsgruppenverwaltung

Für diese Module gilt:

- `ADMIN` bleibt verpflichtend
- das Modul kann nicht deaktiviert werden
- Rollenfreigaben können nicht bearbeitet werden
- Gruppenfreigaben können nicht bearbeitet werden
- manipulierte Datenbankeinträge dürfen die Schutzregeln nicht umgehen

---

# M0 – Fachliches Zugriffsmodell

## Aufgaben

- [x] globale Zugriffsgruppen als verbindliches Modell dokumentieren
- [x] additives Zugriffsmodell dokumentieren
- [x] Deny-Regeln ausdrücklich ausschließen
- [x] Verhalten archivierter Gruppen dokumentieren
- [x] Löschbedingungen dokumentieren
- [x] Verhalten bei Statusänderungen eines Benutzers dokumentieren
- [x] Schutz administrativer Kernmodule dokumentieren
- [x] Zuständigkeiten von Rollen, Gruppen und Modulrichtlinien abgrenzen

## Zugriffsregel

Ein Benutzer besitzt Zugriff auf ein Modul, wenn:

```ts
const hasAccess =
    module.enabled &&
    (module.allowedRoles.includes(user.role) ||
        module.allowedGroupIds.some((groupId) => user.activeGroupIds.includes(groupId)));
```

Dabei gelten zusätzlich folgende Regeln:

- `mandatoryRoles` werden bereits in die effektiven Rollenfreigaben aufgenommen.
- Archivierte Gruppen werden nicht als aktive Benutzergruppe berücksichtigt.
- Archivierte Gruppen werden nicht als aktive Modulfreigabe berücksichtigt.
- Nicht gruppenkonfigurierbare Module besitzen effektiv keine Gruppenfreigaben.
- Unbekannte Modul-IDs werden ignoriert beziehungsweise abgewiesen.
- Dashboard-Sichtbarkeit ist nicht der alleinige Zugriffsschutz.

## Akzeptanzkriterien

- Rollen und Gruppen sind unabhängig voneinander verständlich.
- Eine Rollenfreigabe reicht allein für den Zugriff aus.
- Eine Gruppenfreigabe reicht allein für den Zugriff aus.
- Eine Gruppe kann keine Rollenfreigabe aufheben.
- Archivierte Gruppen gewähren keinen Zugriff.
- Administrative Kernmodule können nicht durch Gruppen geöffnet werden.

---

# M1 – Persistentes Datenmodell

## Aufgaben

- [x] Prisma-Modell `AccessGroup` ergänzen
- [x] Prisma-Modell `UserAccessGroup` ergänzen
- [x] Prisma-Modell `ModuleAccessGroup` ergänzen
- [x] Relation vom Benutzer zu seinen Gruppenzuweisungen ergänzen
- [x] eindeutigen technischen Gruppenschlüssel abbilden
- [x] Archivierungszeitpunkt abbilden
- [x] Datenbankseitigen Löschschutz für verwendete Gruppen einführen
- [x] Migration erzeugen
- [x] Prisma-Client neu generieren
- [ ] Migration in einer leeren Datenbank prüfen
- [ ] Migration mit vorhandenen Benutzern und Modulkonfigurationen prüfen

## Vorgesehenes Schema

```prisma
model User {
  id                 String     @id @default(uuid())
  sc_handle          String     @unique
  password           String
  status             UserStatus @default(PENDING)
  role               Role       @default(GUEST)
  verification_token String     @unique
  failed_attempts    Int        @default(0)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
  rejectedAt         DateTime?
  bannedAt           DateTime?

  accessGroups UserAccessGroup[]

  @@map("users")
}

model AccessGroup {
  id          String    @id @default(uuid())
  key         String    @unique @map("group_key") @db.VarChar(64)
  name        String    @db.VarChar(80)
  description String?   @db.Text
  archivedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  members UserAccessGroup[]
  modules ModuleAccessGroup[]

  @@map("access_groups")
}

model UserAccessGroup {
  userId     String
  groupId    String
  assignedAt DateTime @default(now())

  user  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  group AccessGroup @relation(fields: [groupId], references: [id], onDelete: Restrict)

  @@id([userId, groupId])
  @@index([groupId])
  @@map("user_access_groups")
}

model ModuleAccessGroup {
  moduleId   String
  groupId    String
  assignedAt DateTime @default(now())

  group AccessGroup @relation(fields: [groupId], references: [id], onDelete: Restrict)

  @@id([moduleId, groupId])
  @@index([groupId])
  @@map("module_access_groups")
}
```

## Bewusste Modellierungsentscheidung

`ModuleAccessGroup.moduleId` erhält keine Datenbankrelation zu `ModuleConfiguration`.

Der Grund:

- `ModuleConfiguration` ist eine optionale Überschreibung.
- Gruppenzuweisungen dürfen nicht davon abhängen, ob bereits eine Modulkonfiguration existiert.
- Das Zurücksetzen von Titel oder Sortierung darf Gruppenzuweisungen nicht unbeabsichtigt über Cascade löschen.
- Technische Module werden ausschließlich durch den Modulkatalog definiert.
- Modul-IDs werden serverseitig gegen den Modulkatalog validiert.
- Unbekannte Modul-IDs werden bei der effektiven Konfiguration ignoriert.

## Löschverhalten

- Wird ein Benutzer gelöscht, werden dessen Gruppenzuweisungen entfernt.
- Eine verwendete Gruppe kann durch `Restrict` nicht gelöscht werden.
- Modulzuweisungen müssen vor dem Löschen einer Gruppe explizit entfernt werden.
- Benutzerzuweisungen müssen vor dem Löschen einer Gruppe explizit entfernt werden.

## Akzeptanzkriterien

- Bestehende Benutzer bleiben durch die Migration unverändert erhalten.
- Bestehende Modulkonfigurationen bleiben erhalten.
- Eine Gruppe kann mehreren Benutzern zugeordnet werden.
- Ein Benutzer kann mehreren Gruppen zugeordnet werden.
- Eine Gruppe kann mehreren Modulen zugeordnet werden.
- Eine verwendete Gruppe kann nicht versehentlich gelöscht werden.
- Die Anwendung funktioniert ohne initiale Gruppen oder Seed-Daten.

---

# M2 – Gruppen-Service und Validierung

## Aufgaben

- [x] zentrale Zod-Schemas für Gruppeneingaben erstellen
- [x] technischen Schlüssel normalisieren
- [x] technischen Schlüssel validieren
- [x] Anzeigenamen validieren
- [x] Beschreibung validieren
- [x] eindeutige Schlüsselverletzungen kontrolliert behandeln
- [x] aktive und archivierte Gruppen laden können
- [x] Gruppendetails mit Benutzer- und Modulanzahl laden können
- [x] Gruppen anhand ihrer ID validieren
- [x] aktive Gruppen für Auswahlfelder bereitstellen
- [x] archivierte Gruppen bei Zugriffsentscheidungen ausschließen
- [x] Datenbankzugriffe in einem serverseitigen Gruppen-Service bündeln

## Validierungsregeln

### Technischer Schlüssel

- Pflichtfeld
- wird vor der Validierung getrimmt
- wird in Kleinbuchstaben umgewandelt
- Länge zwischen 3 und 64 Zeichen
- erlaubtes Muster:

```regex
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Beispiel für die Normalisierung:

```text
Org-Leitung → org-leitung
```

Nicht erlaubt sind unter anderem:

```text
org_leitung
-org-leitung
org-leitung-
org--leitung
```

### Anzeigename

- Pflichtfeld
- wird getrimmt
- Länge zwischen 1 und 80 Zeichen

### Beschreibung

- optional
- wird getrimmt
- leerer Text wird als `null` gespeichert
- maximal 300 Zeichen

## Vorgesehene Service-Funktionen

```ts
getAccessGroups(options?: {
    includeArchived?: boolean;
}): Promise<AccessGroupViewModel[]>;

getAccessGroupById(groupId: string): Promise<AccessGroupDetails | null>;

getActiveAccessGroups(): Promise<AccessGroupOption[]>;

getActiveGroupIdsForUser(userId: string): Promise<string[]>;

getActiveGroupIdsByModule(): Promise<Map<string, string[]>>;
```

Die genaue Aufteilung kann während der Implementierung vereinfacht werden, sofern:

- keine Geschäftslogik in React-Komponenten landet
- keine N+1-Abfragen entstehen
- Archivierungsregeln zentral angewendet werden

## Akzeptanzkriterien

- Ungültige Gruppenschlüssel werden abgewiesen.
- Doppelte Gruppenschlüssel werden kontrolliert abgewiesen.
- Archivierte Gruppen werden separat erkennbar geladen.
- Archivierte Gruppen werden nicht als aktiv zurückgegeben.
- Validierung und Normalisierung finden serverseitig statt.
- Datenbankfehler werden nicht ungefiltert an den Client weitergereicht.

---

# M3 – Technischer Modulkatalog

## Aufgaben

- [x] `ModuleConfigurationPolicy` um `allowedGroups` erweitern
- [x] alle bestehenden Moduldefinitionen um die neue Richtlinie ergänzen
- [x] administrative Kernmodule für Gruppenfreigaben sperren
- [x] neues Kernmodul `group-management` ergänzen
- [x] Gruppenverwaltung unter `/admin/groups` registrieren
- [x] Standardreihenfolge der administrativen Module festlegen
- [x] effektive Modulkonfiguration um Gruppenfreigaben erweitern
- [x] unbekannte persistierte Modulzuordnungen ignorieren
- [x] manipulierte Gruppenfreigaben geschützter Module ignorieren
- [x] erstes gruppenkonfigurierbares Modul `member-area` ergänzen
- [x] Route `/member-area` bereitstellen

## Erweiterte Richtlinie

```ts
export interface ModuleConfigurationPolicy {
    title: boolean;
    description: boolean;
    enabled: boolean;
    sortOrder: boolean;
    allowedRoles: boolean;
    allowedGroups: boolean;
}
```

## Neues Kernmodul

```ts
{
    id: 'group-management',
    defaultTitle: 'Zugriffsgruppen',
    defaultDescription: 'Zugriffsgruppen erstellen und Berechtigungen verwalten.',
    defaultSortOrder: 300,
    href: '/admin/groups',
    category: 'administration',
    defaultAllowedRoles: [Role.ADMIN],
    mandatoryRoles: [Role.ADMIN],
    configuration: {
        title: true,
        description: true,
        enabled: false,
        sortOrder: true,
        allowedRoles: false,
        allowedGroups: false,
    },
}
```

## Richtlinien für administrative Kernmodule

Für folgende Module gilt `allowedGroups: false`:

```text
member-management
module-management
group-management
```

Persistierte Gruppenzuweisungen für diese Module werden nicht berücksichtigt.

## Effektive Gruppenfreigaben

Für gruppenkonfigurierbare Module gilt:

- aktive und archivierte Zuordnungen dürfen für die Verwaltungsoberfläche geladen werden
- für die Zugriffsauswertung werden nur aktive Gruppen berücksichtigt
- existieren keine Zuordnungen, gilt eine leere Gruppenfreigabe
- es gibt keine technischen Standardgruppen im Modulkatalog

## Erstes gruppenkonfigurierbares Modul

Das Modul `member-area` dient als erstes reales Zugriffsziel für Rollen- und Gruppenfreigaben.

```ts
{
    id: 'member-area',
    defaultTitle: 'Mitgliederbereich',
    defaultDescription: 'Persönliche Übersicht und freigegebene Organisationsinhalte.',
    defaultSortOrder: 100,
    href: '/member-area',
    category: 'module',
    defaultAllowedRoles: [Role.MEMBER, Role.ADMIN],
    mandatoryRoles: [],
    configuration: {
        title: true,
        description: true,
        enabled: true,
        sortOrder: true,
        allowedRoles: true,
        allowedGroups: true,
    },
}
```

## Akzeptanzkriterien

- Die Gruppenverwaltung erscheint als administratives Dashboard-Modul.
- Nur Administratoren sehen die Gruppenverwaltung.
- Das Modul kann nicht deaktiviert werden.
- Gruppen können das Modul nicht für Mitglieder öffnen.
- Nicht gruppenkonfigurierbare Module ignorieren Datenbankzuordnungen.
- Unbekannte Modul-IDs erzeugen keine Dashboard-Module.

---

# M4 – Gruppenverwaltung

## Aufgaben

- [x] Route `/admin/groups` erstellen
- [x] Route serverseitig auf Administratoren beschränken
- [x] aktive Gruppen anzeigen
- [x] archivierte Gruppen anzeigen
- [x] verständlichen Empty State anzeigen
- [x] Gruppe erstellen
- [x] Anzeigenamen bearbeiten
- [x] Beschreibung bearbeiten
- [x] technischen Schlüssel schreibgeschützt anzeigen
- [x] Gruppe archivieren
- [x] Gruppe wiederherstellen
- [x] ungenutzte Gruppe endgültig löschen
- [x] Benutzeranzahl anzeigen
- [x] Modulanzahl anzeigen
- [x] Erfolgs- und Fehlermeldungen anzeigen
- [x] kritische Aktionen über Bestätigungsdialoge absichern
- [x] Darstellung auf Desktop und Mobilgeräten umsetzen
- [x] Bedienung mit Tastatur sicherstellen

## Vorgesehene Aktionen

```ts
createAccessGroup(input);
updateAccessGroup(input);
archiveAccessGroup(groupId);
restoreAccessGroup(groupId);
deleteAccessGroup(groupId);
```

Alle Aktionen:

- erfordern eine Admin-Session
- validieren Eingaben serverseitig
- verwenden kontrollierte Rückgabetypen
- revalidieren betroffene Routen
- behandeln erwartbare Fehler ohne ungefilterte Exceptions

## Archivieren

Vor dem Archivieren wird deutlich darauf hingewiesen:

- bestehende Zuordnungen bleiben erhalten
- die Gruppe gewährt anschließend keinen Zugriff mehr
- eine Wiederherstellung reaktiviert die Zuordnungen

## Löschen

Der Löschbutton ist nur verfügbar, wenn:

```text
Benutzerzuordnungen = 0
UND
Modulzuordnungen = 0
```

Die Server Action prüft diese Bedingung unabhängig von der Oberfläche erneut.

## Zu revalidierende Routen

```text
/dashboard
/admin/groups
/admin/users
/admin/modules
```

## Akzeptanzkriterien

- Administratoren können Gruppen erstellen und bearbeiten.
- Der technische Schlüssel bleibt unveränderlich.
- Archivierte Gruppen werden eindeutig gekennzeichnet.
- Archivieren entfernt keine Zuordnungen.
- Wiederherstellen reaktiviert die Gruppe.
- Verwendete Gruppen können nicht gelöscht werden.
- Direkte Clientmanipulation kann Löschregeln nicht umgehen.
- Nicht-Administratoren können die Route nicht aufrufen.

---

# M5 – Benutzer-Gruppenzuordnung

## Aufgaben

- [x] Gruppenzugehörigkeiten in der Mitgliederverwaltung laden
- [x] Gruppen als Badges in Benutzerkarten und Benutzertabelle darstellen
- [x] aktive und archivierte Gruppen visuell unterscheiden
- [x] Bearbeitung der Gruppenzugehörigkeiten ermöglichen
- [x] nur aktive Gruppen neu auswählbar machen
- [x] neue Zuweisungen nur für Benutzer mit Status `ACTIVE` erlauben
- [x] vorhandene Zuweisungen bei Statusänderungen erhalten
- [x] archivierte bestehende Zuweisungen anzeigen
- [x] archivierte Zuweisungen beim normalen Speichern erhalten
- [x] Benutzer- und Gruppendaten serverseitig validieren
- [x] Änderungen transaktional speichern
- [x] betroffene Routen revalidieren

## Speicheregeln

Beim Bearbeiten eines aktiven Benutzers:

- aktive Gruppen dürfen hinzugefügt werden
- aktive Gruppen dürfen entfernt werden
- archivierte bestehende Gruppen bleiben erhalten
- unbekannte Gruppen-IDs werden abgewiesen
- archivierte Gruppen dürfen nicht neu hinzugefügt werden

Bei einem Benutzer mit anderem Status:

- bestehende Zuweisungen werden angezeigt
- neue Zuweisungen sind nicht erlaubt
- Statusänderungen entfernen keine bestehenden Zuweisungen

## Vorgesehene Server Action

```ts
updateUserAccessGroups(input: {
    userId: string;
    activeGroupIds: string[];
});
```

Die Server Action:

- erfordert eine Admin-Session
- prüft den Benutzerstatus
- validiert alle Gruppen
- lehnt archivierte neue Gruppen ab
- erhält bestehende archivierte Zuweisungen
- führt Löschen und Erstellen in einer Transaktion aus

## Akzeptanzkriterien

- Ein aktiver Benutzer kann mehreren Gruppen zugeordnet werden.
- Eine aktive Gruppe kann mehreren Benutzern zugeordnet werden.
- Archivierte Gruppen können nicht neu zugeordnet werden.
- Bestehende archivierte Zuweisungen bleiben erhalten.
- Eine Benutzersperrung löscht keine Gruppenzugehörigkeiten.
- Ein Benutzer kann sich nicht selbst über Clientdaten einer Gruppe zuordnen.
- Alle Änderungen sind nach dem Neuladen weiterhin vorhanden.

---

# M6 – Modul-Gruppenzuordnung

## Aufgaben

- [x] effektive Modulkonfiguration um Gruppeninformationen erweitern
- [x] Modulverwaltungs-ViewModel um Gruppen erweitern
- [x] Modulformular um Gruppenfreigaben erweitern
- [x] Gruppen nur bei `allowedGroups: true` bearbeitbar machen
- [x] aktive Gruppen zur Auswahl anbieten
- [x] archivierte bestehende Zuordnungen anzeigen
- [x] archivierte Zuordnungen beim normalen Speichern erhalten
- [x] administrative Kernmodule sichtbar sperren
- [x] Gruppenfreigaben serverseitig validieren
- [x] Modulkonfiguration, Rollen und Gruppen transaktional speichern
- [x] Zurücksetzen der Modulkonfiguration um Gruppen erweitern
- [x] unbekannte Modul- und Gruppen-IDs abweisen
- [x] betroffene Routen revalidieren

## Speicheregeln

Bei einem gruppenkonfigurierbaren Modul:

- aktive Gruppen dürfen hinzugefügt werden
- aktive Gruppen dürfen entfernt werden
- bestehende archivierte Gruppenzuordnungen bleiben beim normalen Speichern erhalten
- archivierte Gruppen dürfen nicht neu hinzugefügt werden

Bei einem nicht gruppenkonfigurierbaren Modul:

- Gruppenfelder sind gesperrt
- übermittelte Gruppen-IDs werden nicht akzeptiert
- vorhandene manipulierte Datenbankeinträge werden nicht wirksam

## Zurücksetzen

Das explizite Zurücksetzen eines Moduls auf die technischen Standardwerte:

- entfernt die persistente Modulkonfiguration
- entfernt konfigurierbare Rollenüberschreibungen
- entfernt alle Gruppenzuordnungen des Moduls
- stellt Titel, Beschreibung, Aktivierung und Sortierung auf Code-Defaults zurück

Das Zurücksetzen ist eine bewusste Ausnahme zur normalen Erhaltung archivierter Zuordnungen.

## Erweiterter Action-Input

```ts
interface SaveModuleConfigurationInput {
    moduleId: string;
    title: string;
    description: string;
    enabled: boolean;
    sortOrder: number;
    allowedRoles: Role[];
    allowedGroupIds: string[];
}
```

## Akzeptanzkriterien

- Gruppenfreigaben werden relational gespeichert.
- Gruppenfreigaben sind unabhängig von der Existenz einer Modulkonfiguration möglich.
- Geschützte Module können keine Gruppenfreigabe erhalten.
- Archivierte Gruppen können nicht neu ausgewählt werden.
- Ein normales Speichern entfernt keine archivierten Zuordnungen.
- Ein explizites Zurücksetzen entfernt alle Modul-Gruppenzuordnungen.
- Änderungen werden im Dashboard unmittelbar berücksichtigt.

---

# M7 – Benutzerbezogene Modulauswertung

## Aufgaben

- [x] rollenbasierte Dashboard-Auswertung auf benutzerbezogene Auswertung umstellen
- [x] aktive Gruppen des angemeldeten Benutzers laden
- [x] aktive Gruppenfreigaben der Module laden
- [x] Rollen- und Gruppenzugriff additiv auswerten
- [x] archivierte Gruppen aus der Auswertung ausschließen
- [x] deaktivierte Module weiterhin ausschließen
- [x] verpflichtende Rollen weiterhin berücksichtigen
- [x] unbekannte Modulzuordnungen ignorieren
- [x] N+1-Abfragen vermeiden
- [x] Dashboard auf den neuen Service umstellen

## Neuer Service

Die bisherige rollenbasierte Funktion:

```ts
getVisibleModulesForRole(role);
```

wird durch eine benutzerbezogene Funktion ersetzt:

```ts
getVisibleModulesForUser({
    userId,
    role,
});
```

Vorgesehener Eingabetyp:

```ts
interface ModuleAccessSubject {
    userId: string;
    role: Role;
}
```

## Auswertung

```ts
function hasModuleAccess(
    module: EffectiveModuleConfiguration,
    userRole: Role,
    activeUserGroupIds: ReadonlySet<string>
): boolean {
    if (!module.enabled) {
        return false;
    }

    if (module.allowedRoles.includes(userRole)) {
        return true;
    }

    return module.allowedGroupIds.some((groupId) => activeUserGroupIds.has(groupId));
}
```

## Performance-Regeln

Die Auswertung darf keine Abfrage pro Modul oder Gruppe ausführen.

Ziel ist eine begrenzte Anzahl von Abfragen für:

- persistente Modulkonfigurationen
- Modul-Gruppenzuordnungen
- aktive Gruppenzugehörigkeiten des Benutzers

Die Daten werden anschließend im Speicher zusammengeführt.

## Akzeptanzkriterien

- Ein Benutzer sieht ein Modul über seine Rolle.
- Ein Benutzer sieht ein Modul über eine gemeinsame aktive Gruppe.
- Ein Benutzer ohne passende Rolle oder Gruppe sieht das Modul nicht.
- Eine archivierte Gruppe gewährt keinen Zugriff.
- Eine Wiederherstellung reaktiviert den Zugriff.
- Ein deaktiviertes Modul wird trotz Gruppenzuweisung nicht angezeigt.
- Administrative Kernmodule bleiben ausschließlich für Administratoren sichtbar.
- Die Auswertung erzeugt keine N+1-Abfragen.

---

# M8 – Serverseitiger Modulzugriffsschutz

## Aufgaben

- [x] zentrale Zugriffsauswertung für einzelne Module bereitstellen
- [x] Helper `requireModuleAccess` vorbereiten
- [x] Modul-ID gegen den technischen Katalog validieren
- [x] angemeldeten Benutzer serverseitig ermitteln
- [x] Rollen- und Gruppenzugriff serverseitig prüfen
- [x] nicht autorisierte Zugriffe kontrolliert behandeln
- [x] bestehendes Admin-Layout für `/admin/*` beibehalten
- [x] Dashboard-Sichtbarkeit nicht als Zugriffsschutz verwenden
- [x] administrative Kernmodule gegen Gruppenmanipulation absichern
- [x] mindestens einen direkten Routenzugriff manuell prüfen

## Vorgesehene API

```ts
async function canUserAccessModule(input: {
    moduleId: string;
    userId: string;
    role: Role;
}): Promise<boolean>;
```

```ts
async function requireModuleAccess(moduleId: string): Promise<AuthenticatedSession>;
```

## Verhalten

- Nicht angemeldete Benutzer werden durch den bestehenden Session-Schutz behandelt.
- Unbekannte Modul-IDs werden nicht akzeptiert.
- Angemeldete, aber nicht berechtigte Benutzer werden kontrolliert abgewiesen oder zum Dashboard geleitet.
- Administrative Routen bleiben zusätzlich durch den bestehenden Adminschutz abgesichert.
- Eine sichtbare Dashboard-Karte ist niemals der alleinige Berechtigungsnachweis.

## Sicherheitsregeln

- Sämtliche Verwaltungs-Actions erfordern eine Admin-Session.
- Benutzer können keine eigenen Gruppenzuweisungen verändern.
- Clientseitig übermittelte Modul-IDs werden gegen den Katalog geprüft.
- Clientseitig übermittelte Gruppen-IDs werden gegen die Datenbank geprüft.
- Archivierte Gruppen werden serverseitig ausgeschlossen.
- Richtlinien des Modulkatalogs haben Vorrang vor Datenbankwerten.
- Unbekannte oder manipulierte Zuordnungen gewähren keinen Zugriff.

## Akzeptanzkriterien

- Direkter Routenzugriff ist ohne Berechtigung nicht möglich.
- Gruppenfreigaben wirken nicht nur auf die Dashboard-Darstellung.
- Adminrouten bleiben ausschließlich für Administratoren erreichbar.
- Manipulierte Datenbankeinträge können geschützte Kernmodule nicht öffnen.
- Der Zugriffsschutz verwendet dieselbe fachliche Regel wie das Dashboard.

---

# M9 – Qualitätssicherung

## Funktionale Tests

- [ ] Anwendung ohne vorhandene Gruppen starten
- [x] gültige Gruppe erstellen
- [x] Gruppenschlüssel normalisieren
- [x] ungültigen Gruppenschlüssel abweisen
- [x] doppelten Gruppenschlüssel abweisen
- [x] Anzeigenamen bearbeiten
- [x] Beschreibung bearbeiten
- [x] technischen Schlüssel nicht bearbeitbar machen
- [x] Gruppe archivieren
- [x] archivierte Gruppe eindeutig darstellen
- [x] Zuordnungen beim Archivieren erhalten
- [x] Zugriff einer archivierten Gruppe entziehen
- [x] Gruppe wiederherstellen
- [x] Zugriff nach Wiederherstellung erneut gewähren
- [x] verwendete Gruppe nicht löschen können
- [x] ungenutzte Gruppe löschen
- [x] aktive Gruppe einem aktiven Benutzer zuordnen
- [x] mehrere Gruppen einem Benutzer zuordnen
- [x] eine Gruppe mehreren Benutzern zuordnen
- [x] archivierte Gruppe nicht neu zuordnen können
- [x] neue Gruppenzuweisung für nicht aktiven Benutzer verhindern
- [x] Gruppenzuweisungen bei Benutzersperrung erhalten
- [x] Gruppe einem gruppenkonfigurierbaren Modul zuordnen
- [ ] Gruppe mehreren Modulen zuordnen
    - Derzeit nicht manuell prüfbar, da der technische Katalog nur ein gruppenkonfigurierbares Fachmodul enthält. Das Datenmodell unterstützt die Mehrfachzuordnung.
- [x] archivierte Gruppe nicht neu einem Modul zuordnen
- [x] geschütztes Kernmodul nicht für Gruppen öffnen können
- [x] Modulreset entfernt Gruppenzuordnungen
- [x] unbekannte Modul-ID abweisen
- [x] unbekannte Gruppen-ID abweisen
- [x] bestehende Gruppenzuweisungen bei nicht aktivem Benutzer entfernen

## Zugriffstests

- [x] Zugriff ausschließlich über Rolle testen
- [x] Zugriff ausschließlich über Gruppe testen
- [x] Zugriff über Rolle und Gruppe gleichzeitig testen
- [x] Zugriff ohne Rolle und Gruppe verhindern
- [x] deaktiviertes Modul trotz Gruppe ausblenden
- [x] archivierte Gruppe aus der Auswertung ausschließen
- [x] wiederhergestellte Gruppe erneut berücksichtigen
- [x] administratives Kernmodul ausschließlich als Admin sehen
- [x] manipulierte Kernmodul-Gruppenzuweisung ignorieren
- [x] direkte Modulroute ohne Berechtigung aufrufen
- [x] direkte Adminroute als Nicht-Admin aufrufen
- [x] unbekannte Modulzuordnung in der Datenbank ignorieren

## Oberflächentests

- [x] Gruppenverwaltung auf Desktop prüfen
- [x] Gruppenverwaltung auf Mobilgeräten prüfen
- [x] Mitgliederverwaltung auf Desktop prüfen
- [x] Mitgliederverwaltung auf Mobilgeräten prüfen
- [x] Modulverwaltung auf Desktop prüfen
- [x] Modulverwaltung auf Mobilgeräten prüfen
- [x] sichtbaren Tastaturfokus prüfen
- [x] Bedienung von Accordions mit Tastatur prüfen
- [x] deaktivierte Buttons und Felder prüfen
- [x] Erfolgs- und Fehlermeldungen prüfen
- [x] Bestätigungsdialoge prüfen
- [x] Empty States prüfen

## Migrationstests

- [x] Migration in einer leeren Datenbank ausführen
- [x] Migration mit bestehenden Benutzern ausführen
- [x] Migration mit bestehenden Modulkonfigurationen ausführen
- [x] bestehende Benutzeranmeldung nach Migration prüfen
- [x] bestehende Rollen nach Migration prüfen
- [x] bestehende Modulkonfigurationen nach Migration prüfen
- [x] Rollback über Datenbankbackup praktisch berücksichtigen

## Technische Prüfung

- [x] `make format` ausführen
- [x] `make lint` ausführen
- [x] `npm run build` ausführen
- [x] `git diff --check` ausführen
- [x] `git status --short` prüfen
- [x] Prisma-Schema validieren
- [x] Prisma-Client erfolgreich generieren
- [x] Migration erfolgreich deployen

## Akzeptanzkriterien

- Bestehende Benutzer-, Rollen- und Modulverwaltung besitzen keine Regressionen.
- Gruppen gewähren Zugriff ausschließlich nach den dokumentierten Regeln.
- Archivierung ist reversibel.
- Löschschutz funktioniert in Oberfläche, Geschäftslogik und Datenbank.
- Administrative Kernmodule bleiben geschützt.
- Direkte Routenzugriffe werden serverseitig geprüft.
- Linting und Production-Build sind erfolgreich.
- Die Migration funktioniert mit leeren und bestehenden Datenbanken.

---

# Nicht Bestandteil

Folgende Funktionen sind ausdrücklich nicht Bestandteil von PR #18:

- Deny-Regeln
- verschachtelte Gruppen
- Gruppen innerhalb anderer Gruppen
- Hierarchien oder Vererbung zwischen Gruppen
- gruppenspezifische Rollen
- direkte Benutzer-zu-Modul-Freigaben
- individuelle Ausnahmen pro Benutzer
- zeitlich begrenzte Gruppenmitgliedschaften
- zeitgesteuerte Modulfreigaben
- automatische Gruppenzuweisung anhand einer Systemrolle
- automatische Gruppenzuweisung anhand des Benutzerstatus
- Synchronisation mit einer Star-Citizen-Organisation
- Import oder Export von Gruppen
- Bulk-Zuweisungen
- Audit-Log für Gruppenänderungen
- Benachrichtigungen bei Berechtigungsänderungen
- Gruppenverwaltung durch Nicht-Administratoren
- Gruppenfreigabe administrativer Kernmodule
- Einführung einer automatisierten Testinfrastruktur

Automatisierte Tests für die Zugriffsauflösung und Gruppenregeln werden in einem gesonderten Folge-PR behandelt.

---

# Mögliche Folge-Features

Nach PR #18 können unter anderem folgende Erweiterungen separat umgesetzt werden:

- automatisierte Unit-Tests für Gruppen- und Modulzugriffsregeln
- Integrationstests für Prisma-Transaktionen
- E2E-Tests für Berechtigungsflüsse
- Audit-Log
- Gruppenverantwortliche
- zeitlich begrenzte Mitgliedschaften
- Bulk-Zuweisungen
- Gruppenimport
- Star-Citizen-Organisationssynchronisation
- detaillierte Berechtigungen innerhalb eines Moduls

---

# Definition of Done

- [x] fachliches Gruppenmodell ist verbindlich dokumentiert
- [x] globale Zugriffsgruppen sind implementiert
- [x] Prisma-Modelle und Migration sind vorhanden
- [x] technischer Gruppenschlüssel ist eindeutig und unveränderlich
- [x] Gruppen können erstellt und bearbeitet werden
- [x] Gruppen können archiviert und wiederhergestellt werden
- [x] verwendete Gruppen können nicht gelöscht werden
- [x] Benutzer können aktiven Gruppen zugeordnet werden
- [x] Module können aktiven Gruppen zugeordnet werden
- [x] archivierte Gruppen behalten ihre Zuordnungen
- [x] archivierte Gruppen gewähren keinen Zugriff
- [x] Rollen- und Gruppenzugriff werden additiv ausgewertet
- [x] Dashboard verwendet die benutzerbezogene Modulauswertung
- [x] serverseitiger Modulzugriffsschutz ist vorhanden
- [x] administrative Kernmodule bleiben geschützt
- [x] Gruppenverwaltung ist ausschließlich für Administratoren erreichbar
- [x] Mitgliederverwaltung zeigt Gruppenzuordnungen
- [x] Modulverwaltung zeigt Gruppenfreigaben
- [x] Desktop- und Mobilansicht sind geprüft
- [x] Migration mit leerer Datenbank ist geprüft
- [x] Migration mit bestehenden Daten ist geprüft
- [x] manuelle Funktionstests sind erfolgreich
- [x] Linting ist erfolgreich
- [x] Production-Build ist erfolgreich
- [x] PR ist konfliktfrei und merge-bereit
