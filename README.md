# ClassKit (teaching_tools)

ClassKit is a lightweight collection of classroom utilities:

- **Cold calling helper**: randomizes student selection while respecting opt-out
  preferences.
- **Breakout group creator**: shuffles a roster into balanced teams based on a
  desired team count or target group size.
- **Peer review matcher**: pairs individuals or groups for reciprocal review
  cycles.

## Installation

No external dependencies are required for the core utilities. If you prefer
working with pandas DataFrames, install pandas alongside the package.

## Usage

```python
from teaching_tools import cold_call_candidates, make_breakout_groups, match_peer_reviews

# Cold calling
roster = {"name": ["Alice", "Bob", "Carla", "Deepak"], "excused": [False, True, False, False]}

cold_call_candidates(roster, sample_size=2, random_state=42)
# ['Deepak', 'Alice']

# Breakout groups
names = ["Alice", "Bob", "Carla", "Deepak", "Evan"]
make_breakout_groups(names, team_count=2, random_state=7)
# [['Evan', 'Alice', 'Deepak'], ['Bob', 'Carla']]

# Peer review matches
participants = ["Team 1", "Team 2", "Team 3", "Team 4"]
match_peer_reviews(participants, random_state=3)
# [('Team 4', 'Team 1'), ('Team 1', 'Team 3'), ('Team 3', 'Team 2'), ('Team 2', 'Team 4')]
```

## Run in your browser

A lightweight web UI lives in `docs/` so it can be published with GitHub
Pages. Open `docs/index.html` locally or configure Pages to serve from the
`docs` directory to try the cold calling, breakout, and peer matching tools
without installing Python. The landing tab explains the tools; switch to
**Cold calls**, **Breakout groups**, or **Peer review matches** to run them.
Upload CSV/text rosters with a header row that is ignored when processing. Each
click creates a new shuffle unless you supply a seed. Cold calls expect
`name,excused` columns; breakout groups and peer matches accept single-column
name lists.

Development note: The browser experience and underlying utilities were
developed by Jae Yeon Kim using OpenAI's Codex. The collection is called
ClassKit and the published site will reference that name.

### Sample data for quick testing

The browser UI ships with sample downloads so you can try the tools
immediately:

- `docs/sample_cold_call_roster.csv` contains `name,excused` columns.
- `docs/sample_breakout_names.csv` lists the same students in a single `name`
  column for group creation.
- `docs/sample_peer_review_names.csv` reuses the roster as a single `name`
  column for peer matching.

### Publishing to GitHub Pages

1. In your GitHub repository, open **Settings > Pages** (requires repo admin
   access).
2. Select **Deploy from a branch** and choose `main` (or your default branch)
   with `/docs` as the root folder.
3. Save. After a minute or two, Pages will publish at
   `https://<your-username>.github.io/<repo-name>/` (for example,
   `https://octocat.github.io/teaching_tools/`).

**Troubleshooting:** If you see a 404 when visiting the Settings page, you
likely don’t have permission to manage Pages on that repository. Fork the repo
to your own account (or ask a maintainer to enable Pages) and repeat the steps
above from your fork at `https://github.com/<your-username>/<repo-name>/`.

Once published, share the Pages URL so anyone can load the web UI directly in a
browser—no additional deployment steps are required.
