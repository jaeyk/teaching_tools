# teaching_tools

A lightweight collection of classroom utilities:

- **Cold calling helper**: randomizes student selection while respecting opt-out
  preferences.
- **Breakout group creator**: shuffles a roster into balanced teams based on a
  desired team count or target group size.

## Installation

No external dependencies are required for the core utilities. If you prefer
working with pandas DataFrames, install pandas alongside the package.

## Usage

```python
from teaching_tools import cold_call_candidates, make_breakout_groups

# Cold calling
roster = {"name": ["Alice", "Bob", "Carla", "Deepak"], "excused": [False, True, False, False]}

cold_call_candidates(roster, sample_size=2, random_state=42)
# ['Deepak', 'Alice']

# Breakout groups
names = ["Alice", "Bob", "Carla", "Deepak", "Evan"]
make_breakout_groups(names, team_count=2, random_state=7)
# [['Evan', 'Alice', 'Deepak'], ['Bob', 'Carla']]
```

## Run in your browser

A lightweight web UI lives in `docs/` so it can be published with GitHub
Pages. Open `docs/index.html` locally or configure Pages to serve from the
`docs` directory to try the cold calling and breakout tools without installing
Python. You can paste rosters directly or upload CSV/text files—cold calling
expects two columns (`name`, `excused`), while breakout grouping accepts a
single column of names. Each click creates a new shuffle unless you supply a
seed.

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
