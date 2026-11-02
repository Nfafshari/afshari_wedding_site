# Release Smoke Test

Manual verification checklist. Run this **against the deployed production URL** after every release — not against `localhost`, and not before the deploy. A gate that only ran pre-deploy has not proven the deploy worked.

**Time:** ~20 minutes
**Run on:** desktop browser + a real phone (or devtools mobile emulation at 375px)

---

## How to use this document

Every step has an **action** and an **expected result**. "Click the button" is not a test; "click the button → the dialog opens" is. If a step has no observable expected result, it is not worth running.

Mark each step:

- **PASS** — matched expectation
- **FAIL (blocker)** — data loss, auth failure, or a core flow broken. Roll back.
- **FAIL (note)** — cosmetic or edge-case. Log an issue, ship anyway.

> ### ⚠️ You are writing to the real database
>
> The planner holds actual wedding data. Every record you create below is real.
>
> **Prefix every test record with `ZZTEST` ** so it sorts to the bottom and is unmistakable. Delete them in the cleanup section at the end. If a step fails partway through, clean up manually before retrying.

---

## 0. Preconditions

- [ ] Deploy finished, Vercel shows **Ready**
- [ ] You know the release version/tag being tested: `v________`
- [ ] You have a browser profile signed out of Google, or a private window
- [ ] Your email is currently in `PLANNER_ALLOW_LIST` in Vercel's **Production** env

---

## 1. Public site — signed out

Use a **private/incognito window** for this entire section. This is the path a signed-out visitor takes.

| # | Action | Expected |
|---|---|---|
| 1.1 | Load `/` | Home shows the names, date, Big Horn Equestrian Center, the days-to-go line and the arched photo; then Our Story, Weekend Details and the RSVP band with the right deadline. "RSVP now" opens `/rsvp`. No link to a page that doesn't exist yet; no layout shift |
| 1.1a | Click **Our Story** in the header (and **Read our story** on Home) | `/our-story` shows the heading, the short excerpt and the photo gallery (2 columns on phones, 3 on desktop, no gaps between mixed shapes); a real photo opens larger on click and closes with Esc; the slim RSVP band at the bottom opens `/rsvp`; tab title "Our Story · Piper & Nathen" |
| 1.1b | Click **Details** in the header, then go back to Home and click each Weekend Details link | `/details` shows The Venue, The Schedule (timeline for Saturday) and Travel (hotels); each Home link lands on its section with the heading visible; Get directions and Book a room open in a new tab |
| 1.1d | Click **FAQ** in the header; open a few questions with the mouse, then Tab to one and press Enter | Each answer opens and closes; several can be open at once; the RSVP question shows the right deadline and an RSVP now link |
| 1.1e | **Production: use a throwaway item.** In the planner add a registry item "Zz Smoke Gift" wanting 2. Open `/registry` signed out | The item shows "0 of 2 claimed"; no claimer names anywhere on the page |
| 1.1f | Claim it with a name not on the guest list, then with a first name only | "We couldn't find that name…", then "Please enter your first and last name." Nothing is saved |
| 1.1g | Claim 1 with the throwaway party's guest name (from 1.7) | "Thank you! You claimed Zz Smoke Gift"; the page shows "1 of 2 claimed"; the planner Registry lists the claim under that guest's name, marked "On the website" |
| 1.1h | Claim it again asking for 2 | "Someone just claimed some, so only 1 is left." Claim 1 and the item shows "Fully claimed" with no Claim button. **Delete the claims and the item in the planner** |
| 1.2 | Check the page title in the browser tab | **Not** "Create Next App" |
| 1.3 | Open devtools console | No red errors |
| 1.4 | Click **RSVP** in the header | Lands on `/rsvp`: RSVP heading, sprig, date and "Kindly respond by …", then the name lookup in a white card with a double gold line; RSVP is gold with a short underline in the header |
| 1.4a | Check the header and footer at 1280px | Burgundy band, links either side of the hanging monogram, every link opens a real page (no link back to `/` that should go elsewhere). Footer: the gold "We can't wait…" line, then Report a bug, Home, Planner |
| 1.4b | At 320px and 768px, press the menu button | Burgundy menu slides in from the left with the same pages; the current page has a gold bar; the X and Esc close it; no sideways scroll |
| 1.5 | Look up a name that is not on the list | Not-found message, no party shown |
| 1.6 | Look up a first name only | Asks for first and last name |
| 1.7 | **Production: use a throwaway party.** In the planner add a party named e.g. "Zz Smoke Test" with two guests and one plus-one allowed. Then look up one guest's full name | Their party shows with both members |
| 1.8 | Respond: mark one attending, one declined, add a plus-one and a contact email, submit | Success message. In `/planner/rsvp` the party shows the answers and the plus-one as pending approval |
| 1.9 | Look up the name again and change the response | Previous answers are prefilled; the change saves |
| 1.10 | **Delete the throwaway party** in the planner | Party and its guests are gone; no real guest was edited |

### 1.11 — RSVP rate limit (do this last in the section)

The public form is protected by a Vercel firewall rule (NFA-33), not by app code, so only the deployed site can prove it. Rule, in Vercel → Project → Firewall → Custom Rules: path equals `/rsvp` and method is `POST`; rate limit about 20 requests per 60 seconds per IP (fixed window); action Deny. Recreate it if it is missing.

1. Check the rule is listed and active.
2. In devtools, copy a name-lookup request (Network → right click → Copy as cURL). Replay it about 25 times in a minute from one machine.
3. Wait a minute, then look up a name and submit in the browser.

**Expected:** the first ~20 replays succeed and later ones return **403** (what this rule's deny sends, measured on 2026-10-30); the denied requests show in the firewall log; after the window the normal lookup and submit work again. A missing or inactive rule is a blocker: the form is open to unlimited guessing.

### 1.12 — Registry rate limit

Same protection as 1.11, for the registry claim (NFA-52). Rule: path equals `/registry` and method is `POST`; rate limit about 20 requests per 60 seconds per IP (fixed window); action Deny. Create it in Vercel on first deploy of the Registry page.

1. Check the rule is listed and active.
2. Copy a claim request (with a made-up name, so nothing is saved) as cURL and replay it about 25 times in a minute.

**Expected:** later replays return **403** and show in the firewall log. A missing rule is a blocker: the claim form is open to unlimited name guessing.

- [ ] Section 1 complete

---

## 2. Authentication & authorization

The highest-blast-radius area. Every failure here is a blocker.

| # | Action | Expected |
|---|---|---|
| 2.1 | Signed out, load `/planner` directly | Redirected to `/sign-in`. Planner content never flashes on screen |
| 2.2 | Signed out, load `/planner/budget` directly | Redirected. Deep links are protected too, not just the index |
| 2.3 | Click sign in with Google | Google consent screen loads on the **production domain** (not localhost) |
| 2.4 | Complete sign-in with your allowlisted account | Lands in `/planner` |
| 2.5 | Reload `/planner` | Still signed in — session persists |

### 2.6 — De-authorized user (do this at least once per release)

1. In Vercel → Production env, remove your email from `PLANNER_ALLOW_LIST`
2. **Redeploy** — the list is parsed at module scope, so an env change alone does nothing
3. With your existing session cookie still set, load `/planner`

**Expected:** blocked. Record *where* you land — `/sign-in` or `/access-denied` — and confirm you are not stuck in a redirect loop.

Observed destination: `________________`

4. Restore your email, redeploy, confirm access returns

- [ ] Section 2 complete

---

## 3. Planner overview

| # | Action | Expected |
|---|---|---|
| 3.1 | Load `/planner` | Renders with real data, not placeholder numbers. No hydration error in the console |
| 3.2 | Check the strip | Days to go, parties responded, paid of estimated and tasks done match the RSVP, Budget and Checklist pages |
| 3.3 | Check **Up next** | Up to 5 undone tasks; overdue ones first with an Overdue chip, then by due date across categories |
| 3.4 | Check the **Budget** card | The paid/estimated bar matches the Budget page; up to 5 categories largest first, the rest as "Other". No pie chart |
| 3.5 | At 1280px, then 390px | Cards in a row share one height at 1280; one column with no sideways scroll at 390 |
| 3.6 | Click each card's "View …" link | Each lands on the right page |

- [ ] Section 3 complete

---

## 4. Checklist

The most complete feature — exercise it hardest.

| # | Action | Expected |
|---|---|---|
| 4.1 | Load `/planner/checklist` | Subtitle reads "N days to go"; the strip shows Tasks done, Overdue and Due in 30 days; every category is open with its tasks by due date |
| 4.2 | Add category `ZZTEST Category` | Appears; success toast fires |
| 4.3 | Add a task to it, with a due date from the picker | Appears under the category with correct date |
| 4.3a | Add a second task due yesterday | It shows a red "Overdue" chip and the Overdue stat counts it; a task due today does not |
| 4.4 | Tick the task's circle | Marks complete (faded, struck through); the category's "N of M done" and the strip update |
| 4.5 | Click To do, then Done in the filter | Each shows only those tasks; a category with none says so; URL gains `?show=` |
| 4.6 | **Reload the page while filtered** | Filter survives the reload |
| 4.7 | Submit the add-category dialog with an empty name | Inline validation error. No crash, no toast-only failure |
| 4.8 | Add a second category with the **same** name | Handled gracefully (`P2002` path) — clear error, not "Something went wrong" |
| 4.8a | Click a task's pencil; change its name, due date and category; save | The task moves to the new category with the new name and date; the dialog opened filled in |
| 4.8b | Click a category's pencil | The dialog opens with the category's current name and icon selected; renaming it and picking another icon saves both |
| 4.9 | Delete the test task | Removed; toast fires |

- [ ] Section 4 complete

---

## 5. Budget

| # | Action | Expected |
|---|---|---|
| 5.1 | Load `/planner/budget` | Summary strip, the "Against your limits" bar and the categories render. Past the target the fourth stat is gold; past the limit it is red and the bar shows a red overflow |
| 5.2 | Confirm totals | Estimated/paid totals match the row data |
| 5.3 | Add category `ZZTEST Budget` | Appears; toast fires |
| 5.4 | Add a line item (the category's "Add line item" row) with an estimated cost | Appears; summary strip and limits bar update |
| 5.5 | Edit a line item with its pencil | Edit dialog opens; saves; totals recalculate |
| 5.5a | Edit the test line item and change its Category | It moves to the other category; both categories' totals update. Moving it next to a line item with the same name is refused under Name |
| 5.6 | Sort by estimated cost, then paid, then balance | Each reorders correctly |
| 5.7 | Check the status chips | A line item matches its status; a category is Paid when every item is, Deposit paid once anything is paid, otherwise Due |
| 5.8 | Remove the test line item, then the category | Both removed; totals return to prior values |

- [ ] Section 5 complete

---

## 6. Documents archive

| # | Action | Expected |
|---|---|---|
| 6.1 | Load `/planner/doc-archive` | Documents render as tiles, newest first. Each shows its icon, a file-type tag (PDF, JPG or PNG), name, company and "Added" date |
| 6.2 | Add document, press Add with nothing filled in, then drop a file, name it `ZZTEST Doc`, add a company and pick an icon | First, each empty field says what's missing; then the doc appears first with the chosen icon |
| 6.3 | Click the tile (not its buttons) | The file opens in a new tab |
| 6.4 | Choose A–Z, then reload | Sorted by name; the URL keeps `?sort=az` and the choice survives the reload |
| 6.5 | Type `zztest` in Find a document | Only `ZZTEST Doc` shows; searching by company works too |
| 6.6 | Type `qqqq` | "No documents match"; Clear search empties the box and shows every document |
| 6.7 | Edit it from the tile's pencil | The form opens filled with its name, company and icon, and has no file drop. Change all three and save: all three update |
| 6.8 | Edit it again, press Delete, then Cancel | Back on the edit form with your edits intact |
| 6.9 | Delete it from the tile's trash icon, Cancel, then delete again and confirm | Cancel keeps it; confirm removes it |

- [ ] Section 6 complete

---

## 7. Registry manager

| # | Action | Expected |
|---|---|---|
| 7.1 | Load `/planner/registry-manager` | Items render A to Z with thumbnails; an item with no image (or a broken one) shows a gold gift icon. Each row shows who claimed it, a "1 of 2" meter and a status chip |
| 7.2 | Click an item's ↗ icon | The product page opens in a new tab; the row does not open or close |
| 7.3 | At 390px wide | Claimed-by names fold under the name; meter and chip stay on the right; no sideways scroll |
| 7.4 | Add item `ZZTEST Item`, pasting an image link | The preview shows the picture (a gift icon while the link is blank or broken); the item appears |
| 7.4a | Edit an item saved without an image | The image field starts blank, not "/window.svg"; Save changes works without touching it. Changing the name to another item's name shows "An item with that name already exists." |
| 7.5 | Open it and use "Add a claim by hand" | Claim records as a row marked "Added by hand" with its date and ×N; the meter and chip update. Once fully claimed the add row reads "Fully claimed" and is disabled |
| 7.5a | Click the item's trash icon while it has a claim | The confirm names who claimed it and Delete is disabled |
| 7.6 | Remove the claim, then delete the item from its trash icon | Both removed |

- [ ] Section 7 complete

---

## 8. RSVP

| # | Action | Expected |
|---|---|---|
| 8.1 | Load `/planner/rsvp` | Page renders; subtitle reads "RSVPs close August 1, 2027"; an empty list shows "No one on the guest list yet" |
| 8.2 | Add a party with two guests and one plus-one allowed | Party appears in the one list, A to Z, with a "Waiting" chip and "2 invited" |
| 8.2a | After step 1.8 (a plus-one pending), reload | The strip shows "Plus-ones to review"; that party starts open with "Needs approval" on the plus-one. Approve it with the check: the row turns to the Approved dropdown, the headcount and strip update and the review stat goes away. Change it to Not approved from the dropdown and back |
| 8.2b | At 390px wide | Contact and dietary notes fold under the name; status stays on the right; no sideways scroll. The notes icon opens the note and song request |
| 8.2c | Click each filter (All, Waiting, Attending, Declined, Plus-one requests), then type a guest's name (not the party's) in "Find a guest"; reload | Counts match the parties shown; the search shows that guest's whole party, opened; filter and search survive the reload. A search with no match shows "No parties match", and Clear filters empties the box and shows everyone |
| 8.3 | Import a small CSV (`party,name,plus_ones`) with the Import button | Toast reports parties created and guests added |
| 8.4 | Import the same CSV again | Parties updated, nothing duplicated |
| 8.5 | Edit a party (rename a guest, change plus-ones allowed) | Changes saved and shown |
| 8.5a | In Add party: leave the name blank, use an existing party's name, type "abc" and then "11" for plus-ones, list the same guest twice, and submit each | Messages: "Party name cannot be empty.", "A party with that name already exists.", "Plus-ones must be a whole number of 0 or more.", "Plus-ones must be 10 or less.", "The same guest is listed twice." Each clears as you type. On a party with a named plus-one, lowering plus-ones to 0 says "1 plus-one is already named, so you cannot allow fewer than 1. Reject one first." |
| 8.6 | Remove a party | Party and its guests disappear |
| 8.7 | Check attendance/status columns and the stats | Values render, no `undefined` or blank enum cells |
| 8.8 | Load `/planner` | Dashboard RSVP numbers match the RSVP page |

- [ ] Section 8 complete

---

## 9. Mobile

Real phone preferred. Otherwise devtools at **375px**.

| # | Action | Expected |
|---|---|---|
| 9.1 | Load `/planner` on mobile | No horizontal scroll |
| 9.2 | Open the offcanvas sidebar | Slides in, overlay dims the page |
| 9.3 | Navigate from the sidebar | Navigates **and** the sidebar closes |
| 9.4 | Watch the sidebar on first paint | Renders as mobile immediately — no desktop-layout flash |
| 9.5 | Open a budget edit dialog on mobile | Mobile dialog opens, fields usable, keyboard doesn't obscure submit |

> **9.4** is the `use-mobile.ts` fix. Before the `useSyncExternalStore` rewrite, expect a brief desktop-layout flash on a real phone.

- [ ] Section 9 complete

---

## 10. Keyboard, focus and the UI kit

Keyboard only: no mouse from 10.1 to 10.7. Run the reflow steps in devtools at **320px**.

| # | Action | Expected |
|---|---|---|
| 10.1 | On any planner page press Tab from the top | Focus ring visible on every stop, in reading order; the current page's nav link is announced as current (`aria-current="page"`) |
| 10.2 | At 320px, Tab to the menu button and press Enter | Menu opens; the current page is marked with a gold bar; Esc closes it |
| 10.3 | On Budget, Tab to a header "Add category", press Enter, then Tab through the form | Dialog opens with focus inside; Tab cycles within it (no trap, no escape to the page) |
| 10.4 | Press Esc | Dialog closes and focus returns to "Add category" |
| 10.5 | Tab to a row's trash icon (`ZZTEST` row), press Enter, then Enter on Delete | Confirm names the row; after the delete, focus lands on the header's main button, not the top of the page |
| 10.6 | On Checklist, Tab to a task's circle and press Space | Task toggles; a screen reader hears "Mark … done, toggle button" |
| 10.7 | On Documents, Tab to a document card | Card shows a focus ring; Enter opens the PDF in a new tab |
| 10.8 | Load each planner page at 320, 768 and 1280px | No sideways scroll; header buttons stack under the title on phones; tables fold extra columns into the name's subline |
| 10.9 | Load `/planner/ui-kit` and scroll to **Contrast** | Every row says Pass or a written Exception; no Fail |
| 10.10 | On the kit page, check Modals, Tables and Page chrome | Each demo renders and its dialogs open and close |
| 10.11 | In devtools set the network to Slow 4G, then open each planner page from the nav | The real title shows at once over a skeleton in the page's shape; the content replaces it without the header, strip or list moving |
| 10.12 | Turn on reduced motion (OS setting, or devtools Rendering) and repeat 10.11 on one page | The skeleton holds still instead of pulsing |

- [ ] Section 10 complete

---

## 11. Error handling & sign-out

| # | Action | Expected |
|---|---|---|
| 11.1 | Trigger any validation error | Error appears inline on the right field |
| 11.2 | Confirm a success toast from any mutation | Toast appears and auto-dismisses |
| 11.3 | Load a nonsense URL, e.g. `/planner/nope` | 404 page, not a crash or stack trace |
| 11.4 | Sign out from the header link (desktop) and from the menu's footer (phone) | Each lands on `/sign-out`, session cleared |
| 11.5 | After signing out, load `/planner` | Redirected to `/sign-in` — session really is gone |

- [ ] Section 11 complete

---

## 12. Cleanup

- [ ] Search each planner page for `ZZTEST` — **zero results remain**
- [ ] Budget totals match their pre-test values
- [ ] Checklist task counts match pre-test values
- [ ] Your email is restored in `PLANNER_ALLOW_LIST` and a redeploy has run

---

## Results log

| Date | Version | Tester | Result | Notes |
|---|---|---|---|---|
| | | | | |
| | | | | |

---

## Automation queue

When a step here fails in production, it has earned an automated test. Move it to Playwright and delete it from this document — this checklist should shrink over time, not grow.

Already queued for Phase 4 E2E:

- 2.1 / 2.2 — signed-out redirect
- 2.6 — de-authorized user
