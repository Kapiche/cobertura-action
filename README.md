# Cobertura action

![](https://github.com/5monkeys/cobertura-action/workflows/Test/badge.svg)

GitHub Action which parse a [XML cobertura report](http://cobertura.github.io/cobertura/) and display the metrics in a GitHub Pull Request.

Many coverage tools can be configured to output cobertura reports:

* [coverage.py](https://coverage.readthedocs.io/en/latest/cmd.html#xml-reporting)
* [Istanbul](https://istanbul.js.org/docs/advanced/alternative-reporters/#cobertura)
* [Maven](https://www.mojohaus.org/cobertura-maven-plugin/)
* [simplecov](https://github.com/colszowka/simplecov/blob/master/doc/alternate-formatters.md#simplecov-cobertura)

This action will not currently work when triggered by pull requests from forks, like is common in open source projects.
This is because the token for forked pull request workflows does not have write permissions on the target repository.
Hopefully GitHub will have a solution for this in the future. In the meantime one can use utilize multiple workflows and
artifacts to circumvent this. See the workflows in this project for an implementation example and this blog post https://securitylab.github.com/research/github-actions-preventing-pwn-requests.


## How it looks like

A comment is added to the pull request with the coverage report.

![alt text](img/comment.png "Pull request comment with metrics")

A check is added to the workflow run.

![alt text](img/check.png "Check with metrics")

The check will succeed or fail based on your threshold when `fail_below_threshold` is set to `true`, this allows you to mandate coverage checks pass on your [protected branches](https://docs.github.com/en/github/administering-a-repository/defining-the-mergeability-of-pull-requests/about-protected-branches).

## Inputs

### `repo_token`

The GITHUB_TOKEN. Defaults to `${{github.token}}`

### `path`

The path to the cobertura report. Defaults to `coverage.xml`. Glob pattern is supported, for example `coverage/*.xml`.

### `skip_covered`

If files with 100% coverage should be ignored. Defaults to `true`.

### `minimum_coverage`

The minimum allowed coverage percentage as an integer.

### `fail_below_threshold`

Fail the action when the minimum coverage was not met.

### `show_line`

Show line rate as specific column.

### `show_branch`

Show branch rate as specific column.

### `show_class_names`

Show class names instead of file names.

### `show_missing`

Show line numbers of statements, per module, that weren't executed.

### `show_missing_max_length`

Crop missing line numbers strings that exceeds this length, provided as an integer.

Default is no crop.

(Note: "&hellip;" is appended to a cropped string)

### `link_missing_lines`

Link missing line numbers. This only has an effect when `show_missing` is set to `true`.
Defaults to `false`.

### `link_missing_lines_source_dir`

Allows specifying a source directory for `link_missing_lines`, that will be inserted
into the resulting URLs, in-between the commit hash and the file path. If unset,
falls back to [`source_dir`](#source_dir).

### `source_dir`

Repository-relative path to the directory the coverage report was generated in.

Coverage XML files usually list filenames relative to the test runner's working
directory (e.g. `src/Button.tsx`), while the GitHub PR diff API and blob URLs
expect repo-relative paths (e.g. `frontend/src/Button.tsx`). `source_dir` is
the prefix that bridges the two:

- For [`only_changed_files`](#only_changed_files), the prefix is stripped from
  each PR-diff filename before it's matched against coverage entries. Files
  outside `source_dir` are ignored.
- For [`link_missing_lines`](#link_missing_lines), `source_dir` is used as the
  prefix when building blob URLs (unless
  [`link_missing_lines_source_dir`](#link_missing_lines_source_dir) is set
  explicitly).

Leave unset if your coverage XML already uses repo-relative paths. See the
[monorepo example](#monorepo-setup) below.

### `only_changed_files`

Only show coverage for changed files.

### `report_name`

Use a unique name for the report and comment.

### `pull_request_number` **Optional**

Pull request number associated with the report. This property should be used when workflow trigger is different than `pull_request`.

If no pull request can determine the action will skip adding the comment.

## Example usage

```yaml
on:
  pull_request:
    types: [opened]
    branches:
      - master
jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: 5monkeys/cobertura-action@master
        with:
          path: src/test.xml
          minimum_coverage: 75
```

## Monorepo setup

In a monorepo where each package has its own coverage report, the coverage XML
will list filenames relative to the test runner's working directory but the PR
diff API returns them repo-relative. Without translation, `only_changed_files`
filters everything out and `link_missing_lines` points at URLs that 404.

Set [`source_dir`](#source_dir) to the path from the repo root to the directory
the coverage report was generated in. One action invocation per package, each
with its own `source_dir`, `report_name`, and `check_name`:

```yaml
jobs:
  frontend-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Kapiche/cobertura-action@v19
        with:
          path: frontend/coverage/cobertura-coverage.xml
          source_dir: frontend
          minimum_coverage: 50
          only_changed_files: true
          show_missing: true
          link_missing_lines: true
          report_name: Frontend Coverage Report
          check_name: frontend-coverage

  backend-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Kapiche/cobertura-action@v19
        with:
          path: backend/coverage.xml
          source_dir: backend
          minimum_coverage: 80
          only_changed_files: true
          show_missing: true
          link_missing_lines: true
          report_name: Backend Coverage Report
          check_name: backend-coverage
```

What happens:

- `frontend/coverage/cobertura-coverage.xml` contains entries like
  `src/Button.tsx`. The PR diff contains `frontend/src/Button.tsx`. With
  `source_dir: frontend` the prefix is stripped from the PR diff entry, so
  the two line up and the file appears in the report.
- Files the PR changed outside `frontend/` (e.g. `backend/api.py`,
  `README.md`) are dropped from the matching set — they have no coverage
  data in this XML.
- Missing-line links resolve to `…/blob/<sha>/frontend/src/Button.tsx`
  rather than the broken `…/blob/<sha>/src/Button.tsx`.
- Distinct `report_name` and `check_name` per package keep each report's
  PR comment and commit check separate.

If the diff and link prefixes need to differ (e.g. coverage filenames are
class paths like `com/foo/Bar.java` but the actual source lives under
`src/main/java/com/foo/Bar.java`), set
[`link_missing_lines_source_dir`](#link_missing_lines_source_dir) for the link
prefix and `source_dir` for the diff-match prefix independently.

## Development

- Install deps: `npm ci`
- Run tests: `npm run test`
- Run lint: `npm run lint`
- Package application `npm run package`. Remember to run this before committing anything.
