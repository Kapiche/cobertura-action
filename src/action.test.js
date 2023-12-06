const nock = require("nock");

const owner = "someowner";
const repo = "somerepo";
const dummyReport = {
  total: 77.5,
  line: 77.5,
  branch: 0,
  files: [
    {
      name: "ClassFoo",
      filename: "__init__.py",
      total: 80,
      line: 80,
      branch: 0,
      missing: [["24", "26"]],
    },
    {
      name: "ClassBar",
      filename: "bar.py",
      total: 75,
      line: 80,
      branch: 0,
      missing: [
        ["23", "24"],
        ["39", "40"],
        ["50", "50"],
      ],
    },
    {
      name: "ClassMoo",
      filename: "foo.py",
      total: 75,
      line: 100,
      branch: 75,
      missing: [],
    },
  ],
};

beforeEach(() => {
  process.env["INPUT_REPO_TOKEN"] = "hunter2";
  process.env["GITHUB_REPOSITORY"] = `${owner}/${repo}`;
  process.exitCode = 0;
  process.stdout.write = jest.fn();
});

test("action", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/test-branch.xml";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = "";
  process.env["INPUT_PULL_REQUEST_COMMENT"] = "true";
  const prNumber = 1;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);
  await action({
    pull_request: { number: prNumber, head: { sha: "" } },
  });
  await action();
});

test("action triggered by workflow event", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/test-branch.xml";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = "";
  const prNumber = 1;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls?state=open`)
    .reply(200, [
      {
        number: 1,
        head: {
          sha: "",
        },
      },
    ])
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);
  await action({
    workflow_run: { head_commit: { id: "" } },
  });
});

test("action triggered by push", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/test-branch.xml";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_FAIL_BELOW_THRESHOLD"] = "true";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";

  const body = {
    name: "coverage",
    head_sha: "",
    status: "completed",
    conclusion: "failure",
    output: {
      title: "Coverage: 82% (actual) < 100% (expected)",
      summary:
        '<strong>Coverage Report - 82%</strong>\n\n| File | Coverage |   |\n| - | :-: | :-: |\n| **All files** | `82%` | :x: |\n| search/BinarySearch.java | `87%` | :x: |\n| search/LinearSearch.java | `69%` | :x: |\n\n_Minimum allowed coverage is `100%`_\n\n<p align="right">Generated by :monkey: cobertura-action against deadbeef </p>',
    },
  };
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/check-runs`, body)
    .reply(200);
  await action({
    after: "",
  });
});

test("action passing pull request number directly", async () => {
  const { action } = require("./action");
  const prNumber = 123;
  process.env["INPUT_PATH"] = "./src/fixtures/test-branch.xml";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = prNumber;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
    .reply(200, {
      head: {
        sha: "deadbeef",
      },
    })
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);
  await action({
    push: { ref: "master" },
  });
});

test("action only changes", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/test-branch.xml";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "true";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = "";
  const prNumber = 1;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
    .reply(200, [
      {
        filename: "file1.txt",
      },
    ])
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);

  await action({
    pull_request: { number: prNumber, head: { sha: "deadbeef" } },
  });
  await action();
});

test("action with report name", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/test-branch.xml";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "true";
  process.env["INPUT_REPORT_NAME"] = "Test Report";
  const prNumber = 1;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
    .reply(200, [
      {
        filename: "file1.txt",
      },
    ])
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);

  await action({
    pull_request: { number: prNumber, head: { sha: "deadbeef" } },
  });
  await action();
});

test("action with crop missing lines", async () => {
  const { action } = require("./action");
  process.env["INPUT_PATH"] = "./src/fixtures/test-branch.xml";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "true";
  process.env["INPUT_SHOW_MISSING_MAX_LENGTH"] = "10";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = "";
  const prNumber = 1;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);
  await action({
    pull_request: { number: prNumber, head: { sha: "deadbeef" } },
  });
  await action();
});

test("action failing on coverage below threshold", async () => {
  const { action } = require("./action");
  const prNumber = 123;
  process.env["INPUT_PATH"] = "./src/fixtures/test-branch.xml";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "100";
  process.env["INPUT_FAIL_BELOW_THRESHOLD"] = "true";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = prNumber;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
    .reply(200, {
      head: {
        sha: "deadbeef",
      },
    })
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);

  await action({
    push: { ref: "master" },
  });
  expect(process.exitCode).toBe(1);
  expect(process.stdout.write).toHaveBeenCalledTimes(1);
  expect(process.stdout.write).toHaveBeenCalledWith(
    "::error::Minimum coverage requirement was not satisfied\n"
  );
});

test("action not failing on coverage above threshold", async () => {
  const { action } = require("./action");
  const prNumber = 123;
  process.env["INPUT_PATH"] = "./src/fixtures/test-branch.xml";
  process.env["INPUT_SKIP_COVERED"] = "true";
  process.env["INPUT_SHOW_BRANCH"] = "false";
  process.env["INPUT_SHOW_LINE"] = "false";
  process.env["INPUT_MINIMUM_COVERAGE"] = "82";
  process.env["INPUT_FAIL_BELOW_THRESHOLD"] = "true";
  process.env["INPUT_SHOW_CLASS_NAMES"] = "false";
  process.env["INPUT_SHOW_MISSING"] = "false";
  process.env["INPUT_ONLY_CHANGED_FILES"] = "false";
  process.env["INPUT_PULL_REQUEST_NUMBER"] = prNumber;
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }])
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
    .reply(200, {
      head: {
        sha: "deadbeef",
      },
    })
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);
  await action({
    push: { ref: "master" },
  });
  expect(process.exitCode).toBe(0);
  expect(process.stdout.write).toHaveBeenCalledTimes(0);
});

test("markdownReport", () => {
  const { markdownReport } = require("./action");
  const commit = "deadbeef";
  const reportName = "TestReport";
  const defaultReportName = "Coverage Report";
  expect(
    markdownReport([dummyReport], commit, {
      minimumCoverage: 70,
      reportName: reportName,
    })[0]
  ).toBe(`<strong>${reportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:white_check_mark:</td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td>__init__.py</td><td align="center"><code>80%</code></td><td align="center">:white_check_mark:</td></tr>
<tr><td>bar.py</td><td align="center"><code>75%</code></td><td align="center">:white_check_mark:</td></tr>
<tr><td>foo.py</td><td align="center"><code>75%</code></td><td align="center">:white_check_mark:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`70%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(markdownReport([dummyReport], commit)[0])
    .toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td>__init__.py</td><td align="center"><code>80%</code></td><td align="center">:x:</td></tr>
<tr><td>bar.py</td><td align="center"><code>75%</code></td><td align="center">:x:</td></tr>
<tr><td>foo.py</td><td align="center"><code>75%</code></td><td align="center">:x:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport([dummyReport], commit, {
      minimumCoverage: 70,
      showLine: true,
    })[0]
  ).toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th>Lines</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center"><code>77%</code></td><td align="center">:white_check_mark:</td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td>__init__.py</td><td align="center"><code>80%</code></td><td align="center"><code>80%</code></td><td align="center">:white_check_mark:</td></tr>
<tr><td>bar.py</td><td align="center"><code>75%</code></td><td align="center"><code>80%</code></td><td align="center">:white_check_mark:</td></tr>
<tr><td>foo.py</td><td align="center"><code>75%</code></td><td align="center"><code>100%</code></td><td align="center">:white_check_mark:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`70%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport([dummyReport], commit, {
      minimumCoverage: 70,
      showBranch: true,
    })[0]
  ).toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th>Branches</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td>__init__.py</td><td align="center"><code>80%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td></tr>
<tr><td>bar.py</td><td align="center"><code>75%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td></tr>
<tr><td>foo.py</td><td align="center"><code>75%</code></td><td align="center"><code>75%</code></td><td align="center">:white_check_mark:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`70%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport([dummyReport], commit, {
      minimumCoverage: 70,
      showLine: true,
      showBranch: true,
    })[0]
  ).toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th>Lines</th><th>Branches</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center"><code>77%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td>__init__.py</td><td align="center"><code>80%</code></td><td align="center"><code>80%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td></tr>
<tr><td>bar.py</td><td align="center"><code>75%</code></td><td align="center"><code>80%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td></tr>
<tr><td>foo.py</td><td align="center"><code>75%</code></td><td align="center"><code>100%</code></td><td align="center"><code>75%</code></td><td align="center">:white_check_mark:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`70%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport([dummyReport], commit, {
      minimumCoverage: 70,
      showLine: true,
      showBranch: true,
      showMissing: true,
    })[0]
  ).toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th>Lines</th><th>Branches</th><th> </th><th>Missing</th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center"><code>77%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td><td align="center"> </td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td>__init__.py</td><td align="center"><code>80%</code></td><td align="center"><code>80%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td><td align="center"><code>24-&NoBreak;26</code></td></tr>
<tr><td>bar.py</td><td align="center"><code>75%</code></td><td align="center"><code>80%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td><td align="center"><code>23-&NoBreak;24</code> <code>39-&NoBreak;40</code> <code>50</code></td></tr>
<tr><td>foo.py</td><td align="center"><code>75%</code></td><td align="center"><code>100%</code></td><td align="center"><code>75%</code></td><td align="center">:white_check_mark:</td><td align="center"> </td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`70%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport([dummyReport], commit, {
      minimumCoverage: 70,
      showLine: true,
      showBranch: true,
      showMissing: true,
      showMissingMaxLength: 5,
    })[0]
  ).toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th>Lines</th><th>Branches</th><th> </th><th>Missing</th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center"><code>77%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td><td align="center"> </td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td>__init__.py</td><td align="center"><code>80%</code></td><td align="center"><code>80%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td><td align="center"><code>24-&NoBreak;26</code></td></tr>
<tr><td>bar.py</td><td align="center"><code>75%</code></td><td align="center"><code>80%</code></td><td align="center"><code>0%</code></td><td align="center">:white_check_mark:</td><td align="center"><code>23-&NoBreak;24</code> &hellip;</td></tr>
<tr><td>foo.py</td><td align="center"><code>75%</code></td><td align="center"><code>100%</code></td><td align="center"><code>75%</code></td><td align="center">:white_check_mark:</td><td align="center"> </td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`70%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(markdownReport([dummyReport], commit, { minimumCoverage: 80 })[0])
    .toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td>__init__.py</td><td align="center"><code>80%</code></td><td align="center">:white_check_mark:</td></tr>
<tr><td>bar.py</td><td align="center"><code>75%</code></td><td align="center">:x:</td></tr>
<tr><td>foo.py</td><td align="center"><code>75%</code></td><td align="center">:x:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`80%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(markdownReport([dummyReport], commit, { showClassNames: true })[0])
    .toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td></tr>
<tr><td>ClassFoo</td><td align="center"><code>80%</code></td><td align="center">:x:</td></tr>
<tr><td>ClassBar</td><td align="center"><code>75%</code></td><td align="center">:x:</td></tr>
<tr><td>ClassMoo</td><td align="center"><code>75%</code></td><td align="center">:x:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport([dummyReport], commit, { filteredFiles: ["bar.py"] })[0]
  ).toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td>bar.py</td><td align="center"><code>75%</code></td><td align="center">:x:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport([dummyReport], commit, { filteredFiles: ["README.md"] })[0]
  ).toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(markdownReport([dummyReport], commit, { filteredFiles: [] })[0])
    .toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport(
      [
        {
          folder: "foo.xml",
          ...dummyReport,
        },
        {
          folder: "bar.xml",
          ...dummyReport,
        },
      ],
      commit,
      { filteredFiles: [] }
    )[0]
  ).toBe(`<strong>${defaultReportName} foo.xml - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td></tr>
</tbody>
</table>

<strong>${defaultReportName} bar.xml - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport([dummyReport], commit, {
      showMissing: true,
      linkMissingLines: true,
      showMissingMaxLength: 200,
    })[0]
  ).toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th><th>Missing</th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td><td align="center"> </td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td><a href="https://github.com/someowner/somerepo/blob/deadbeef/__init__.py" title="__init__.py">__init__.py</a></td><td align="center"><code>80%</code></td><td align="center">:x:</td><td align="center"><a href="https://github.com/someowner/somerepo/blob/deadbeef/__init__.py?plain=1#L24-L26" title="24-26"><code>24-&NoBreak;26</code></a></td></tr>
<tr><td><a href="https://github.com/someowner/somerepo/blob/deadbeef/bar.py" title="bar.py">bar.py</a></td><td align="center"><code>75%</code></td><td align="center">:x:</td><td align="center"><a href="https://github.com/someowner/somerepo/blob/deadbeef/bar.py?plain=1#L23-L24" title="23-24"><code>23-&NoBreak;24</code></a> <a href="https://github.com/someowner/somerepo/blob/deadbeef/bar.py?plain=1#L39-L40" title="39-40"><code>39-&NoBreak;40</code></a> <a href="https://github.com/someowner/somerepo/blob/deadbeef/bar.py?plain=1#L50" title="50"><code>50</code></a></td></tr>
<tr><td><a href="https://github.com/someowner/somerepo/blob/deadbeef/foo.py" title="foo.py">foo.py</a></td><td align="center"><code>75%</code></td><td align="center">:x:</td><td align="center"> </td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport([dummyReport], commit, {
      showMissing: true,
      linkMissingLines: true,
      linkMissingLinesSourceDir: "path/to/src/",
      showMissingMaxLength: 200,
    })[0]
  ).toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th><th>Missing</th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td><td align="center"> </td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td><a href="https://github.com/someowner/somerepo/blob/deadbeef/path/to/src/__init__.py" title="__init__.py">__init__.py</a></td><td align="center"><code>80%</code></td><td align="center">:x:</td><td align="center"><a href="https://github.com/someowner/somerepo/blob/deadbeef/path/to/src/__init__.py?plain=1#L24-L26" title="24-26"><code>24-&NoBreak;26</code></a></td></tr>
<tr><td><a href="https://github.com/someowner/somerepo/blob/deadbeef/path/to/src/bar.py" title="bar.py">bar.py</a></td><td align="center"><code>75%</code></td><td align="center">:x:</td><td align="center"><a href="https://github.com/someowner/somerepo/blob/deadbeef/path/to/src/bar.py?plain=1#L23-L24" title="23-24"><code>23-&NoBreak;24</code></a> <a href="https://github.com/someowner/somerepo/blob/deadbeef/path/to/src/bar.py?plain=1#L39-L40" title="39-40"><code>39-&NoBreak;40</code></a> <a href="https://github.com/someowner/somerepo/blob/deadbeef/path/to/src/bar.py?plain=1#L50" title="50"><code>50</code></a></td></tr>
<tr><td><a href="https://github.com/someowner/somerepo/blob/deadbeef/path/to/src/foo.py" title="foo.py">foo.py</a></td><td align="center"><code>75%</code></td><td align="center">:x:</td><td align="center"> </td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);

  expect(
    markdownReport([dummyReport], commit, {
      showMissing: true,
      linkMissingLines: true,
      showMissingMaxLength: 12,
    })[0]
  ).toBe(`<strong>${defaultReportName} - 77%</strong>

<br/>
<table>
<tbody>
<tr><th>File</th><th>Coverage</th><th> </th><th>Missing</th></tr>
<tr><td><strong>All files</strong></td><td align="center"><code>77%</code></td><td align="center">:x:</td><td align="center"> </td></tr>
</tbody>
<tbody>
<tr><td colspan="10"><h4></h4></td></tr>
</tbody>
<tbody>
<tr><td><a href="https://github.com/someowner/somerepo/blob/deadbeef/__init__.py" title="__init__.py">__init__.py</a></td><td align="center"><code>80%</code></td><td align="center">:x:</td><td align="center"><a href="https://github.com/someowner/somerepo/blob/deadbeef/__init__.py?plain=1#L24-L26" title="24-26"><code>24-&NoBreak;26</code></a></td></tr>
<tr><td><a href="https://github.com/someowner/somerepo/blob/deadbeef/bar.py" title="bar.py">bar.py</a></td><td align="center"><code>75%</code></td><td align="center">:x:</td><td align="center"><a href="https://github.com/someowner/somerepo/blob/deadbeef/bar.py?plain=1#L23-L24" title="23-24"><code>23-&NoBreak;24</code></a> <a href="https://github.com/someowner/somerepo/blob/deadbeef/bar.py?plain=1#L39-L40" title="39-40"><code>39-&NoBreak;40</code></a> &hellip;</td></tr>
<tr><td><a href="https://github.com/someowner/somerepo/blob/deadbeef/foo.py" title="foo.py">foo.py</a></td><td align="center"><code>75%</code></td><td align="center">:x:</td><td align="center"> </td></tr>
</tbody>
</table>

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`);
});

test("addComment", async () => {
  const { addComment } = require("./action");
  const prNumber = "5";
  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: "some body", id: 123 }]);
  await addComment(prNumber, "foo", "bar");
});

test("addComment with update", async () => {
  const { addComment } = require("./action");
  const prNumber = "5";
  const commentId = 123;
  const oldComment = `<strong>bar</strong>

| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`78%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`;

  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: oldComment, id: commentId }])
    .patch(`/repos/${owner}/${repo}/issues/comments/${commentId}`)
    .reply(200, [{ body: oldComment, id: commentId }]);
  await addComment(prNumber, "foo", "bar");
});

test("addComment for specific report", async () => {
  const { addComment } = require("./action");
  const prNumber = "5";
  const commentId = 123;
  const report1Comment = `Report1
| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`78%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`;

  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [{ body: report1Comment, id: commentId }]);
  await addComment(prNumber, "foo", "Report2");
});

test("addComment with update for specific report", async () => {
  const { addComment } = require("./action");
  const prNumber = "5";
  const comment1Id = 123;
  const comment2Id = 456;
  const report1Comment = `Report1
| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`78%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`;
  const report2Comment = `Report2
| File | Coverage |   |
| - | :-: | :-: |
| **All files** | \`82%\` | :x: |

_Minimum allowed coverage is \`100%\`_

<p align="right">Generated by :Kapiche: cobertura-action </p>`;

  nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/issues/${prNumber}/comments`)
    .reply(200, [
      { body: report1Comment, id: comment1Id },
      { body: report2Comment, id: comment2Id },
    ])
    .patch(`/repos/${owner}/${repo}/issues/comments/${comment2Id}`)
    .reply(200, [{ body: report2Comment, id: comment2Id }]);
  await addComment(prNumber, "foo", "Report2");
});

test("listChangedFiles", async () => {
  const { listChangedFiles } = require("./action");
  const prNumber = "5";
  nock("https://api.github.com")
    .get(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
    .reply(200, [
      {
        filename: "file1.txt",
      },
    ]);
  await listChangedFiles(prNumber);
});

test("addCheck", async () => {
  const { addCheck } = require("./action");
  const checkRunMock = nock("https://api.github.com")
    .post(`/repos/${owner}/${repo}/check-runs`)
    .reply(200);

  await addCheck("foo", "bar", "fake_sha", "success");

  // Clean up nock mocks after addCheck has completed
  nock.cleanAll();

  // Additional delay, if needed
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(checkRunMock.pendingMocks().length).toBe(0);
});
